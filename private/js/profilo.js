document.addEventListener("DOMContentLoaded", () => {
  // Funzione per ottenere i dati utente
  async function caricaDatiUtente() {
    try {
      const response = await fetch("/api/userinfo", {
        credentials: "include", // per inviare cookie (token)
      });

      if (!response.ok) {
        throw new Error("Errore nel recupero dati utente");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Utente non autenticato");
      }

      // Popolo i dati nella pagina
      document.getElementById("userNome").textContent = data.nome || "";
      document.getElementById("userCognome").textContent = data.cognome || "";
      document.getElementById("userEmail").textContent = data.email || "";

      // Ora carico gli ordini
      await caricaOrdini();

    } catch (err) {
      console.error(err);
      alert("Errore nel caricamento del profilo, verrai reindirizzato alla login.");
      window.location.href = "/login_register.html"; // o la tua pagina login
    }
  }

  // Funzione per caricare gli ordini utente
  async function caricaOrdini() {
    try {
      const response = await fetch("/api/user/orders", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Errore nel recupero ordini");

      const data = await response.json();

      const ordiniContainer = document.getElementById("userOrdini");
      ordiniContainer.innerHTML = "";

      if (data.success && data.orders.length > 0) {
        data.orders.forEach(order => {
          const div = document.createElement("div");
          div.textContent = `Il tuo ordine con id: #${order.id} - Totale: €${order.total_price} - Data: ${new Date(order.order_date).toLocaleDateString()}`;
          ordiniContainer.appendChild(div);
        });
      } else {
        ordiniContainer.textContent = "Nessun ordine effettuato.";
      }
    } catch (err) {
      console.error(err);
      document.getElementById("userOrdini").textContent = "Impossibile caricare gli ordini.";
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

  // Carica i dati utente appena la pagina è pronta
  caricaDatiUtente();
});