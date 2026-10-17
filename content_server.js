require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");
const { authenticateToken, admin } = require("./middlewares/middleware");

const app = express();
const port = 3002;

app.use(express.json());
app.use(cookieParser());

// Connessione al database
const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_CONTENT_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
});

// 🛒 Ordini dell'utente autenticato
app.get("/api/user/orders", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [orders] = await connection.promise().query(
      `SELECT id, total_price, shipping_address, order_date
       FROM orders
       WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Errore recupero ordini:", err);
    res.status(500).json({ success: false, message: "Errore interno al server" });
  }
});

// 📦 Tutti i prodotti con nome categoria
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await connection.promise().query(`
      SELECT p.id, p.name, p.description, p.image_url, p.price, p.quantity, p.discount_price, c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    res.json({ success: true, products });
  } catch (err) {
    console.error("Errore nel recupero prodotti:", err);
    res.status(500).json({ success: false, message: "Errore nel recupero dei prodotti" });
  }
});



// ⭐ Prodotti in evidenza (primi 6)
app.get("/api/products/featured", async (req, res) => {
  try {
    const [products] = await connection.promise().query(
      `SELECT p.id, p.name, p.description, p.image_url, p.price, p.quantity, p.discount_price, c.name AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.id DESC
       LIMIT 6`
    );
    res.json({ success: true, products });
  } catch (err) {
    console.error("Errore nel recupero prodotti in evidenza:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// 💸 Prodotti in sconto
app.get("/api/products/discounted", async (req, res) => {
  try {
    const [products] = await connection.promise().query(
      `SELECT p.id, p.name, p.description, p.image_url, p.price, p.quantity, p.discount_price, c.name AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.discount_price IS NOT NULL AND p.discount_price < p.price`
    );
    res.json({ success: true, products });
  } catch (err) {
    console.error("Errore nel recupero prodotti in sconto:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// 🔍 Ricerca prodotti per nome
app.get("/api/products/search", async (req, res) => {
  const searchTerm = req.query.q || "";

  try {
    const [results] = await connection.promise().query(
      `SELECT p.id, p.name
       FROM products p
       WHERE p.name LIKE CONCAT('%', ?, '%')
       LIMIT 10`,
      [searchTerm]
    );
    res.json({ success: true, results });
  } catch (err) {
    console.error("Errore nella ricerca prodotti:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});


app.post("/api/cart/add", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || typeof quantity !== 'number' || quantity < 1) {
    return res.status(400).json({ success: false, message: "Dati mancanti o non validi" });
  }

  try {
    // Trova o crea ordine in stato draft
    let [orders] = await connection.promise().query(
      `SELECT id FROM orders WHERE user_id = ? AND status = 'draft' LIMIT 1`,
      [userId]
    );

    let orderId;
    if (orders.length === 0) {
      const [insert] = await connection.promise().query(
        `INSERT INTO orders (user_id, total_price, shipping_address, status) VALUES (?, 0, '', 'draft')`,
        [userId]
      );
      orderId = insert.insertId;
    } else {
      orderId = orders[0].id;
    }

    // Controlla se il prodotto è già nel carrello (ordine draft)
    let [existing] = await connection.promise().query(
      `SELECT id, quantity FROM order_items WHERE order_id = ? AND product_id = ?`,
      [orderId, productId]
    );

    if (existing.length > 0) {
      // Aggiorna quantità sommando
      await connection.promise().query(
        `UPDATE order_items SET quantity = ? WHERE id = ?`,
        [existing[0].quantity + quantity, existing[0].id]
      );
    } else {
      // Prendi prezzo dal prodotto (scontato o normale)
      let [prodData] = await connection.promise().query(
        `SELECT price, discount_price FROM products WHERE id = ?`,
        [productId]
      );

      if (prodData.length === 0) {
        return res.status(404).json({ success: false, message: "Prodotto non trovato" });
      }

      const price = (prodData[0].discount_price && prodData[0].discount_price < prodData[0].price)
        ? prodData[0].discount_price
        : prodData[0].price;

      await connection.promise().query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [orderId, productId, quantity, price]
      );
    }

    return res.json({ success: true, message: "Prodotto aggiunto al carrello" });
  } catch (err) {
    console.error("Errore cart/add:", err);
    return res.status(500).json({ success: false, message: "Errore interno al server" });
  }
});

app.get("/api/cart", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Trova l'ordine attivo (carrello) per l'utente
    const [[ordine]] = await connection.promise().query(
      `SELECT id FROM orders WHERE user_id = ? AND status = 'draft' LIMIT 1`,
      [userId]
    );

    if (!ordine) {
      return res.json({ success: true, items: [] });
    }

    // Prendi i prodotti nel carrello (order_items)
    const [items] = await connection.promise().query(
      `SELECT oi.id AS order_item_id, p.id AS product_id, p.name, p.image_url, oi.quantity, oi.price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [ordine.id]
    );

    res.json({ success: true, items });
  } catch (err) {
    console.error("Errore nel recupero del carrello:", err);
    res.status(500).json({ success: false, message: "Errore nel recupero del carrello" });
  }
});

app.put("/api/cart/update", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || typeof quantity !== "number" || quantity < 1) {
    return res.status(400).json({ success: false, message: "Dati non validi" });
  }

  try {
    // Trova l'ordine con status 'draft'
    const [[ordine]] = await connection.promise().query(
      "SELECT id FROM orders WHERE user_id = ? AND status = 'draft' LIMIT 1",
      [userId]
    );

    if (!ordine) {
      return res.status(404).json({ success: false, message: "Carrello non trovato" });
    }

    // Aggiorna la quantità del prodotto
    await connection.promise().query(
      "UPDATE order_items SET quantity = ? WHERE order_id = ? AND product_id = ?",
      [quantity, ordine.id, productId]
    );

    res.json({ success: true, message: "Quantità aggiornata correttamente" });
  } catch (err) {
    console.error("Errore aggiornamento quantità:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

app.delete("/api/cart/remove", authenticateToken, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  try {
    // Trova l'ordine draft dell'utente
    const [draftOrders] = await connection.promise().query(
      `SELECT id FROM orders WHERE user_id = ? AND status = 'draft' LIMIT 1`,
      [userId]
    );

    if (draftOrders.length === 0) {
      return res.status(400).json({ success: false, message: "Nessun carrello trovato" });
    }

    const orderId = draftOrders[0].id;

    // Rimuovi il prodotto
    await connection.promise().query(
      `DELETE FROM order_items WHERE order_id = ? AND product_id = ?`,
      [orderId, productId]
    );

    // Controlla se l'ordine ha ancora prodotti
    const [remainingItems] = await connection.promise().query(
      `SELECT COUNT(*) AS count FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    if (remainingItems[0].count === 0) {
      // Cancella l'ordine se è vuoto
      await connection.promise().query(
        `DELETE FROM orders WHERE id = ?`,
        [orderId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Errore nella rimozione dal carrello:", err);
    res.status(500).json({ success: false, message: "Errore interno" });
  }
});

app.post("/api/order/confirm", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    nazione,
    citta,
    via,
    cartaNome,
    numeroCarta,
    scadenza,
    cvc,
    codiceSconto
  } = req.body;

  if ( !nazione || !citta || !via || !cartaNome || !numeroCarta || !scadenza || !cvc) {
    return res.status(400).json({ success: false, message: "Dati di spedizione o pagamento mancanti" });
  }

// 👇 Validazione simulata numero carta (solo cifre, 13-19 caratteri)
if (!/^\d{13,19}$/.test(numeroCarta)) {
  return res.status(400).json({ success: false, message: "Numero carta non valido (MIN 13, MAX 19) cifre" });
}

// 👇 Validazione CVC (3 o 4 cifre)
if (!/^\d{3}$/.test(cvc)) {
  return res.status(400).json({ success: false, message: "CVC non valido" });
}

// 👇 Validazione scadenza MM/YY e data non passata
if (!/^\d{2}\/\d{2}$/.test(scadenza)) {
  return res.status(400).json({ success: false, message: "Formato scadenza non valido (MM/YY)" });
} else {
  const [mese, anno] = scadenza.split("/").map(Number);
  if (mese < 1 || mese > 12) {
    return res.status(400).json({ success: false, message: "Mese di scadenza non valido" });
  }

  const now = new Date();
  const oggi = new Date(now.getFullYear(), now.getMonth());
  const scadenzaDate = new Date(`20${anno}`, mese - 1); // zero-based month

  if (scadenzaDate < oggi) {
    return res.status(400).json({ success: false, message: "Carta scaduta" });
  }
}


  try {
    // Recupera dati utente (nome, cognome, email)
    const [[user]] = await connection.promise().query(
      "SELECT nome, cognome, email FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Utente non trovato" });
    }

    // Trova ordine draft
    const [[order]] = await connection.promise().query(
      "SELECT id FROM orders WHERE user_id = ? AND status = 'draft' LIMIT 1",
      [userId]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Carrello vuoto o ordine non trovato" });
    }

    // Calcola totale ordine sommando prezzi da order_items
    const [items] = await connection.promise().query(
      "SELECT quantity, price FROM order_items WHERE order_id = ?",
      [order.id]
    );

    let totale = 0;
    items.forEach(item => {
      totale += item.quantity * item.price;
    });

    // Applica sconto se codice valido
    if (codiceSconto) {
      const [discountRows] = await connection.promise().query(
        "SELECT discount_percent FROM discount_codes WHERE code = ?",
        [codiceSconto]
      );

      if (discountRows.length > 0) {
        const discount = discountRows[0].discount_percent;
        totale = totale * (1 - discount / 100);
      } else {
        return res.status(400).json({ success: false, message: "Codice sconto non valido" });
      }
    }

    // Prepara indirizzo spedizione in formato stringa (puoi cambiarlo come preferisci)
    const indirizzoSpedizione = `${via}, ${citta}, ${nazione}`;



    // Aggiorna ordine con dati completi e cambia status in confirmed
    await connection.promise().query(
      `UPDATE orders SET 
         total_price = ?, 
         shipping_address = ?, 
         status = 'confirmed',
         order_date = NOW()
       WHERE id = ?`,
      [totale.toFixed(2), indirizzoSpedizione, order.id]
    );

    res.json({ success: true, message: "Ordine confermato con successo" });

  } catch (err) {
    console.error("Errore conferma ordine:", err);
    res.status(500).json({ success: false, message: "Errore interno al server" });
  }
});

app.get("/api/discount/validate", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ success: false, message: "Codice mancante" });
  }

  try {
    const [rows] = await connection.promise().query(
      "SELECT discount_percent FROM discount_codes WHERE code = ?",
      [code]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Codice sconto non valido" });
    }

    return res.json({ success: true, discount_percent: rows[0].discount_percent });
  } catch (err) {
    console.error("Errore validazione codice sconto:", err);
    return res.status(500).json({ success: false, message: "Errore server" });
  }
});

app.post("/api/contact", async (req, res) => {
  const { nome, cognome, email, telefono, messaggio, terms, gdpr } = req.body;

  if (!nome || !cognome || !email || !messaggio|| gdpr !== true) {
    return res.status(400).json({ success: false, message: "Dati mancanti o consensi non accettati" });
  }

  try {
    await connection.promise().query(
      `INSERT INTO messages (nome, cognome, email, telefono, messaggio, accetta_terms, accetta_gdpr)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, cognome, email, telefono, messaggio, terms, gdpr]
    );

    res.json({ success: true, message: "Messaggio inviato con successo!" });
  } catch (err) {
    console.error("Errore salvataggio messaggio:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});



app.post("/api/reviews", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, reviewText } = req.body;

  if (!productId || !reviewText) {
    return res.status(400).json({ success: false, message: "Campi mancanti" });
  }

  try {
    await connection.promise().query(
      `INSERT INTO reviews (user_id, product_id, review_text) VALUES (?, ?, ?)`,
      [userId, productId, reviewText]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Errore inserimento recensione:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

app.get("/api/reviews", async (req, res) => {
  const { product_id, category, order, detailed } = req.query;

  try {
    let query = `
      SELECT r.review_text, r.created_at, u.nome, u.cognome
    `;
    const params = [];
    const conditions = [];

    if (detailed === "true") {
      query += `, p.id AS product_id, c.name AS category_name, p.name AS product_name, p.image_url
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            JOIN products p ON r.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
      `;
    } else {
      query += `
                FROM reviews r
                JOIN users u ON r.user_id = u.id
      `;
    }

    if (product_id) {
      conditions.push("r.product_id = ?");
      params.push(product_id);
    } 
    if (category) {
      if (detailed === "true") {
        conditions.push("c.name = ?");
      } else {
        // se non detailed, category filter non funziona, o gestisci diversamente
        return res.status(400).json({ success: false, message: "Filtro categoria solo con detailed=true" });
      }
      params.push(category);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    if (order === "recenti") {
      query += " ORDER BY r.created_at DESC";
    }

    const [rows] = await connection.promise().query(query, params);
    res.json({ success: true, reviews: rows });
  } catch (err) {
    console.error("Errore fetch recensioni:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await connection.promise().query("SELECT id, name FROM categories");
    res.json({ success: true, categories: rows });
  } catch (err) {
    console.error("Errore fetch categorie:", err);
    res.status(500).json({ success: false });
  }
});


// --- API ADMIN protette ---

// Visualizza tutti gli utenti
app.get("/api/admin/users", authenticateToken, admin, async (req, res) => {
  try {
    const [users] = await connection.promise().query(
      "SELECT nome, cognome, email, is_admin, created_at FROM users"
    );
    res.json({ success: true, users });
  } catch (err) {
    console.error("Errore fetching users:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// Visualizza tutti gli ordini con info utente
app.get("/api/admin/orders", authenticateToken, admin, async (req, res) => {
  try {
    const [orders] = await connection.promise().query(
      `SELECT o.id, o.total_price, o.shipping_address, o.order_date, o.status,
              u.id AS user_id, u.nome, u.cognome, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.order_date DESC`
    );
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Errore fetching orders:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// Visualizza i dettagli di un ordine specifico
app.get("/api/admin/orders/:id", authenticateToken, admin, async (req, res) => {
  const orderId = req.params.id;
  try {
    const [[order]] = await connection.promise().query(
      `SELECT o.id, o.total_price, o.shipping_address, o.order_date, o.status,
              u.id AS user_id, u.nome, u.cognome, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Ordine non trovato" });
    }

    const [items] = await connection.promise().query(
      `SELECT oi.id, oi.product_id, p.name AS product_name, oi.quantity, oi.price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({ success: true, order, items });
  } catch (err) {
    console.error("Errore fetching order details:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// Recupera tutti i prodotti (per dashboard admin)
app.get("/api/admin/products", authenticateToken, admin, async (req, res) => {
  try {
    const [rows] = await connection.promise().query("SELECT * FROM products");
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// Aggiungi nuovo prodotto
app.post("/api/admin/products", authenticateToken, admin, async (req, res) => {
  const { name, description, image_url, price, quantity, category_id, discount_price } = req.body;

  if (!name || !image_url || price === undefined) {
    return res.status(400).json({ success: false, message: "Campi obbligatori mancanti" });
  }

  try {
    await connection.promise().execute(
      `INSERT INTO products (name, description, image_url, price, quantity, category_id, discount_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, image_url, price, quantity || 0, category_id, discount_price]
    );
    res.json({ success: true, message: "Prodotto aggiunto" });
  } catch (err) {
    console.error("Errore aggiunta prodotto:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// Modifica prodotto
app.put("/api/admin/products/:id", authenticateToken, admin, async (req, res) => {
  const productId = req.params.id;
  const { name, description, image_url, price, quantity, category_id, discount_price } = req.body;

  try {
    const [result] = await connection.promise().execute(
      `UPDATE products SET name=?, description=?, image_url=?, price=?, quantity=?, category_id=?, discount_price =?
       WHERE id=?`,
      [name, description || null, image_url, price, quantity || 0, category_id || null, discount_price || 0, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Prodotto non trovato" });
    }

    res.json({ success: true, message: "Prodotto aggiornato" });
  } catch (err) {
    console.error("Errore modifica prodotto:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// Rimuovi prodotto
app.delete("/api/admin/products/:id", authenticateToken, admin, async (req, res) => {
  const productId = req.params.id;
  try {
    const [result] = await connection.promise().execute(
      "DELETE FROM products WHERE id = ?",
      [productId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Prodotto non trovato" });
    }
    res.json({ success: true, message: "Prodotto rimosso" });
  } catch (err) {
    console.error("Errore rimozione prodotto:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// Elimina utente
app.delete("/api/admin/users/:id", authenticateToken, admin, async (req, res) => {
  const userId = req.params.id;

  try {
    // Evitiamo che l'admin possa eliminare se stesso (opzionale)
    if (req.user.id == userId) {
      return res.status(400).json({ success: false, message: "Non puoi eliminare te stesso" });
    }

    await connection.promise().execute("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ success: true, message: "Utente eliminato" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Errore durante l'eliminazione" });
  }
});

// Modifica is_admin di un utente
app.patch("/api/admin/users/:id", authenticateToken, admin, async (req, res) => {
  const userId = req.params.id;
  const { is_admin } = req.body;

  if (typeof is_admin !== "boolean") {
    return res.status(400).json({ success: false, message: "'is_admin' deve essere booleano" });
  }

  try {
    // Opzionale: impedire all'admin di togliere a se stesso i permessi admin
    if (req.user.id == userId && is_admin === false) {
      return res.status(400).json({ success: false, message: "Non puoi toglierti i permessi admin" });
    }

    await connection.promise().execute("UPDATE users SET is_admin = ? WHERE id = ?", [is_admin, userId]);
    res.json({ success: true, message: "Permessi aggiornati" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Errore durante l'aggiornamento" });
  }
});

app.get("/api/admin/messaggi", authenticateToken, admin, async (req, res) => {
  try {
    const [rows] = await connection.promise().query(
      `SELECT id, nome, cognome, email, messaggio, accetta_terms, accetta_gdpr, data_invio
       FROM messages
       ORDER BY data_invio DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Errore nel recupero dei messaggi:", err);
    res.status(500).json({ success: false, message: "Errore interno del server" });
  }
});

app.get("/api/admin/reviews", authenticateToken, admin, async (req, res) => {
  try {
    const [reviews] = await connection.promise().query(`
      SELECT r.id, r.review_text, r.created_at,
             u.nome AS user_nome, u.cognome AS user_cognome,
             p.name AS product_nome
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("Errore fetching reviews:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

app.delete("/api/admin/reviews/:id", authenticateToken, admin, async (req, res) => {
  try {
    const { id } = req.params;
    await connection.promise().query(`DELETE FROM reviews WHERE id = ?`, [id]);
    res.json({ success: true, message: "Recensione eliminata" });
  } catch (err) {
    console.error("Errore eliminazione recensione:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});











//  Dettaglio prodotto per ID
app.get("/api/products/:id", async (req, res) => {
  const productId = req.params.id;

if(!productId){
 res.status(400).json({error: "ID del prodotto mancante"});
        return;
}

  try {
    const [results] = await connection.promise().query(
      `SELECT p.id, p.name, p.description, p.image_url, p.price, p.quantity, p.discount_price, c.name AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [productId]
    );

  
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Prodotto non trovato" });
    }

    res.json({ success: true, product: results[0] });
  } catch (err) {
    console.error("Errore nel recupero del prodotto:", err);
    res.status(500).json({ success: false, message: "Errore interno al server" });
  }
});

// Avvio server
app.listen(port, () => {
  console.log(`Content server in ascolto su http://localhost:${port}`);
});
