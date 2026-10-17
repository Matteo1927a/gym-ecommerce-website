const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware di autenticazione con JWT
function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ success: false, message: "Token mancante o non valido" });
    }
    return res.redirect(302, "/login_register.html");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
  console.error("Errore verifica JWT:", err.name, err.message);
  return res.redirect(302, "/index.html");
}
}

// Middleware per controllo admin
function admin(req, res, next) {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    return res.status(403).send("Accesso negato: permessi insufficienti");
  }
}

module.exports = {
  authenticateToken,
  admin,
};
