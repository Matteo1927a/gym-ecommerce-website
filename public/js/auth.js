document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // LOGIN
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("emailLogin").value.trim();
    const password = document.getElementById("passwordLogin").value.trim();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials:"include",
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Login effettuato con successo!");
        if (result.is_admin) {
          window.location.href = "/admin/admin.html";
        } else {
          window.location.href = "/private/profilo.html";
        }
      } else {
        alert("Errore: " + result.message);
      }
    } catch (error) {
      console.error("Errore durante il login:", error);
      alert("Errore durante la richiesta di login.");
    }
  });

  // REGISTRAZIONE
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const cognome = document.getElementById("cognome").value.trim();
    const email = document.getElementById("emailReg").value.trim();
    const password = document.getElementById("passwordReg").value.trim();
    const confermaPassword = document.getElementById("confermaPassword").value.trim();
  

    if (password !== confermaPassword) {
      alert("Le password non coincidono.");
      return;
    }

    try {
      const response = await fetch("/api/registr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          cognome,
          email,
          password,
          conferma_password: confermaPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Registrazione avvenuta con successo! Ora puoi effettuare il login.");
        loginForm.scrollIntoView({ behavior: "smooth" });
      } else {
        alert("Errore: " + result.message);
      }
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      alert("Errore durante la richiesta di registrazione.");
    }
  });
});