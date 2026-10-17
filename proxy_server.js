require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cookieParser = require("cookie-parser");
const { authenticateToken, admin } = require("./middlewares/middleware");

const app = express();
const port = 3000;

app.use(cookieParser())
const authTarget = "http://localhost:3001";
const contentTarget = "http://localhost:3002";

;

app.use(express.static("public"));

// Sezioni protette
app.use("/private", authenticateToken, express.static("private"));
app.use("/admin", authenticateToken, admin, express.static("admin"));

// Proxy per API autenticazione (login, registrazione, logout, userinfo)
app.use("/api/login", createProxyMiddleware({
  target: authTarget + "/api/login",
  changeOrigin: true,
}));
app.use("/api/registr", createProxyMiddleware({
  target: authTarget + "/api/registr",
  changeOrigin: true,
}));
app.use("/api/logout", createProxyMiddleware({
  target: authTarget +"/api/logout",
  changeOrigin: true,
}));
app.use("/api/userinfo", createProxyMiddleware({
  target: authTarget + "/api/userinfo" ,
  changeOrigin: true,
}));

// Proxy per altre API (contenuti, prodotti ecc)
app.use("/api", createProxyMiddleware({
  target: contentTarget + "/api",
  changeOrigin: true,
}));


// Avvio server
app.listen(port, () => {
  console.log(`Proxy Server attivo su http://localhost:${port}`);
});



