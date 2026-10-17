
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { authenticateToken, admin } = require("./middlewares/middleware");

const app = express();
const port = 3001;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cookieParser());
app.use(express.json());

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_AUTH_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
});


// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Email e password sono obbligatorie"
    });

  const query = `
    SELECT id, nome, cognome, email, password,
           is_admin, created_at
    FROM users
    WHERE email = ?
  `;

  try {
    const [rows] = await connection.promise().execute(query, [email]);

    if (rows.length === 0)
      return res.status(401).json({
        success: false,
        message: "Credenziali non valide"
      });

    const user = rows[0];

    // Verifica la password confrontandola con l'hash salvato nel database
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid)
      return res.status(401).json({
        success: false,
        message: "Credenziali non valide"
      });

    const payload = {
      id: user.id,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      is_admin: user.is_admin,
      created_at: user.created_at,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
      sameSite: "Strict",
    });

    return res.json({
      success: true,
      message: "Login riuscito",
      is_admin: user.is_admin
    });

  } catch (err) {
    console.error("Errore login:", err);
    return res.status(500).json({
      success: false,
      message: "Errore interno al server"
    });
  }
});


// REGISTRAZIONE
app.post("/api/registr", async (req, res) => {
  const { nome, cognome, email, password, conferma_password } = req.body;

  if (!nome || !cognome || !email || !password || !conferma_password)
    return res.status(400).json({ success: false, message: "Tutti i campi sono obbligatori" });

  if (password !== conferma_password)
    return res.status(401).json({ success: false, message: "Le password non coincidono" });

  try {
    const [existing] = await connection.promise().execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0)
      return res.json({ success: false, message: "Email già in uso" });

    // Genera l'hash della password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Inserisce l'utente salvando l'hash
    await connection.promise().execute(
      "INSERT INTO users (nome, cognome, email, password) VALUES (?, ?, ?, ?)",
      [nome, cognome, email, hashedPassword]
    );

    return res.json({ success: true, message: "Utente creato" });
  } catch (err) {
    console.error("Errore registrazione:", err);
    return res.status(500).json({ success: false, message: "Errore interno al server" });
  }
});

// INFO UTENTE (protetto)
app.get("/api/userinfo", authenticateToken, (req, res) => {
  res.json({
    success: true,
    id: req.user.id,
    nome: req.user.nome,
    cognome: req.user.cognome,
    email: req.user.email,
    is_admin: req.user.is_admin,
    created_at: req.user.created_at,
  });
});

// LOGOUT
app.post("/api/logout", authenticateToken, (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logout effettuato" });
});

app.listen(port, () => {
  console.log(`Auth Server in ascolto su http://localhost:${port}`);
});
