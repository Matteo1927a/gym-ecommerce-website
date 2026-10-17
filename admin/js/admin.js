

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const messaggiTbody = document.querySelector("#tabella-messaggi tbody");
  const recensioniTbody = document.querySelector("#tabella-recensioni tbody");


  // Cambio tab
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;

      tabContents.forEach(tc => {
        tc.classList.toggle("hidden", tc.id !== target);
      });


      if (target === "messaggi") {
      caricaMessaggi();
    }

     if (target === "recensioni") {
        caricaRecensioni(); 
      }


    });
  });

  // Selezione tabelle tbody
  const utentiTbody = document.querySelector("#tabella-utenti tbody");
  const prodottiTbody = document.querySelector("#tabella-prodotti tbody");
  const ordiniTbody = document.querySelector("#tabella-ordini tbody");

  // Carica utenti
  async function loadUtenti() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) return alert("Errore nel caricare gli utenti");
    const data = await res.json();
    utentiTbody.innerHTML = data.users.map(u => `
      <tr>
        <td>${u.nome}</td>
        <td>${u.cognome}</td>
        <td>${u.email}</td>
        <td>${u.is_admin ? "Sì" : "No"}</td>
        
      </tr>
    `).join("");
  }

  // Carica prodotti
const loadProdotti = async () => {
  const res = await fetch("/api/admin/products");
  const data = await res.json();
  if (!data.success) return;

  const tbody = document.querySelector("#tabella-prodotti tbody");
  tbody.innerHTML = "";

  data.products.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
       <td>
    ${p.discount_price && p.discount_price > 0
      ? `<span class="prezzo-originale">€${p.price}</span> <strong>€${p.discount_price}</strong>`
      : `<strong>€${p.price}</strong>`}
  </td>
      <td>${p.quantity}</td>
      <td>
        <button class="modifica-prodotto" data-id="${p.id}">Modifica</button>
        <button class="elimina-prodotto" data-id="${p.id}">Elimina</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

  // Carica ordini
  async function loadOrdini() {
    const res = await fetch("/api/admin/orders");
    if (!res.ok) return alert("Errore nel caricare gli ordini");
    const data = await res.json();
    ordiniTbody.innerHTML = data.orders.map(o => `
      <tr>
        <td>${o.id}</td>
        <td>${o.nome} ${o.cognome}</td>
        <td>${new Date(o.order_date).toLocaleString()}</td>
        <td>€${Number(o.total_price).toFixed(2)}</td>
        <td><button data-id="${o.id}" class="dettagli-ordine">Dettagli</button></td>
      </tr>
    `).join("");
  }


prodottiTbody.addEventListener("click", async e => {
  const id = e.target.dataset.id;

  if (e.target.classList.contains("modifica-prodotto")) {
    try {
      // Recupera i dati attuali del prodotto (puoi tenerli già in memoria se vuoi)
      const res = await fetch(`/api/admin/products`);
      const data = await res.json();
      const prodotto = data.products.find(p => p.id == id);
      if (!prodotto) return alert("Prodotto non trovato");

      // Prompt per modificare 
      const nuovoNome = prompt("Nome prodotto:", prodotto.name);
      const nuovoPrezzo = prompt("Prezzo:", prodotto.price);
      const nuovaQuantita = prompt("Quantità:", prodotto.quantity);

      if (!nuovoNome || isNaN(nuovoPrezzo) || isNaN(nuovaQuantita)) {
        return alert("Dati non validi");
      }

      const resModifica = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: nuovoNome,
          price: parseFloat(nuovoPrezzo),
          quantity: parseInt(nuovaQuantita),
          image_url: prodotto.image_url,
          description: prodotto.description,
          category_id: prodotto.category_id,
          discount_price: prodotto.discount_price
        })
      });

      const result = await resModifica.json();
      if (!result.success) {
        return alert("Errore nella modifica: " + result.message);
      }

      alert("Prodotto modificato con successo");
      loadProdotti();

    } catch (err) {
      console.error(err);
      alert("Errore nella modifica del prodotto");
    }
  }

  if (e.target.classList.contains("elimina-prodotto")) {
    if (confirm(`Sei sicuro di voler eliminare il prodotto ID ${id}?`)) {
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE"
        });
        const result = await res.json();
        if (!result.success) {
          return alert("Errore: " + result.message);
        }
        alert("Prodotto eliminato");
        loadProdotti();
      } catch (err) {
        console.error(err);
        alert("Errore di rete nell'eliminazione");
      }
    }
  }
});

  // Eventi dinamici: dettagli ordine
  ordiniTbody.addEventListener("click", async e => {
    if (e.target.classList.contains("dettagli-ordine")) {
      const id = e.target.dataset.id;
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) return alert("Errore nel caricare dettagli ordine");
      const data = await res.json();
      const itemsList = data.items.map(i => `${i.product_name} (qtà: ${i.quantity})`).join("\n");
      alert(`Ordine #${id}:\n\nProdotti:\n${itemsList}`);
    }
  });

  // Bottone aggiungi prodotto
const btnAggiungiProdotto = document.getElementById("aggiungi-prodotto");
btnAggiungiProdotto.addEventListener("click", async () => {
  const nome = prompt("Nome prodotto:");
  if (!nome) return alert("Nome obbligatorio");

  const descrizione = prompt("Descrizione prodotto:");

 const imageFile = prompt("Nome immagine (es: pesi.jpg):");
 const image_url = imageFile;

  const prezzoStr = prompt("Prezzo prodotto (€):");
  const prezzo = parseFloat(prezzoStr);
  if (isNaN(prezzo)) return alert("Prezzo non valido");

  const quantitaStr = prompt("Quantità:");
  const quantita = parseInt(quantitaStr);
  if (isNaN(quantita)) return alert("Quantità non valida");

const catRes = await fetch("/api/categories");
const catData = await catRes.json();
if (!catData.success) return alert("Errore nel recupero categorie");

const catList = catData.categories.map(c => `${c.id}: ${c.name}`).join("\n");
const categoryStr = prompt(`Scegli una categoria (inserisci ID):\n${catList}`);
const category_id = parseInt(categoryStr);
if (isNaN(category_id)) return alert("Categoria non valida");


  const nuovaProd = {
    name: nome,
    description: descrizione, 
    price: prezzo,
    quantity: quantita,
    image_url,
    category_id,
    discount_price: null,
  };

  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuovaProd),
  });

  const result = await res.json();
  if (!res.ok || !result.success) return alert("Errore: " + result.message);

  alert("Prodotto aggiunto");
  loadProdotti();
});

  async function eliminaUtente(id) {
  if (!confirm("Sei sicuro di voler eliminare questo utente?")) return;

  const res = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();

  if (data.success) {
    alert("Utente eliminato!");
    loadUtenti(); // ricarica la lista
  } else {
    alert("Errore: " + data.message);
  }
}

async function toggleAdmin(id, currentValue) {
  const nuovoValore = !currentValue;

  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_admin: nuovoValore }),
  });
  const data = await res.json();

  if (data.success) {
    alert("Permessi aggiornati!");
    loadUtenti();
  } else {
    alert("Errore: " + data.message);
  }
}

async function loadUtenti() {
  const res = await fetch("/api/admin/users");
  const data = await res.json();

  if (data.success) {
    const tbody = document.querySelector("#tabella-utenti tbody");
    tbody.innerHTML = "";

    data.users.forEach((user) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${user.nome}</td>
        <td>${user.cognome}</td>
        <td>${user.email}</td>
        <td>
          <input type="checkbox" ${user.is_admin ? "checked" : ""} />
        </td>
        <td>
          <button class="btn-elimina">Elimina</button>
        </td>
      `;

      // Checkbox is_admin toggle
      const checkbox = tr.querySelector("input[type=checkbox]");
      checkbox.addEventListener("change", () => toggleAdmin(user.id, user.is_admin));

      // Bottone elimina
      const btnElimina = tr.querySelector(".btn-elimina");
      btnElimina.addEventListener("click", () => eliminaUtente(user.id));

      tbody.appendChild(tr);
    });
  } else {
    alert("Errore nel caricamento utenti");
  }
}

async function caricaMessaggi() {
  try {
    const res = await fetch('/api/admin/messaggi');
    const messaggi = await res.json();

    const tbody = document.querySelector('#tabella-messaggi tbody');
    tbody.innerHTML = '';

    messaggi.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.nome} ${m.cognome}</td>
        <td>${m.email}</td>
     
        <td>${m.messaggio}</td>
        <td>${new Date(m.data_invio).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Errore nel caricamento dei messaggi:', err);
  }
}

async function caricaRecensioni() {
  try {
    const res = await fetch("/api/admin/reviews", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    const data = await res.json();
    if (data.success) {
      const tbody = document.querySelector("#tabella-recensioni tbody");
      tbody.innerHTML = ""; // svuota

      data.reviews.forEach(recensione => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${recensione.user_nome} ${recensione.user_cognome}</td>
          <td>${recensione.product_nome}</td>
          <td>${recensione.review_text}</td>
          <td>${new Date(recensione.created_at).toLocaleString()}</td>
          <td><button class="btn-elimina" data-id="${recensione.id}">Elimina</button></td>
        `;
        tbody.appendChild(tr);
      });

      // Aggiungi listener per i bottoni elimina
      document.querySelectorAll(".btn-elimina").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          if (confirm("Sei sicuro di voler eliminare questa recensione?")) {
            const delRes = await fetch(`/api/admin/reviews/${id}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              }
            });
            const delData = await delRes.json();
            if (delData.success) {
              caricaRecensioni(); // ricarica la tabella
            } else {
              alert("Errore durante l'eliminazione.");
            }
          }
        });
      });

    } else {
      alert("Errore nel caricamento recensioni");
    }
  } catch (error) {
    console.error("Errore fetch recensioni:", error);
  }
}




     
 // Funzione per logout
  async function logout() {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/login_register.html";
      } else {
        alert("Errore durante il logout");
      }
    } catch (err) {
      console.error(err);
      alert("Errore durante il logout");
    }
  }

  // Evento click bottone logout
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Inizializza caricamenti e mostra tab utenti
  tabs[0].click();
  loadUtenti();
  loadProdotti();
  loadOrdini();
});