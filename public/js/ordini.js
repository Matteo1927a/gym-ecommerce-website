
document.addEventListener("DOMContentLoaded", () => {

    caricaCarrello();


function caricaCarrello() {
    fetch('/api/cart', {
        method: 'GET',
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                mostraCarrello(data.items);
            } else {
                document.getElementById("carrello").innerHTML = "<p>Errore nel caricamento del carrello.</p>";
            }
        })
        .catch(err => {
            console.error("Errore nel recupero del carrello:", err);
        });
}

let totaleSenzaSconto = 0;

function mostraCarrello(items) {
    const carrelloContainer = document.getElementById("carrello");

    if (items.length === 0) {
        carrelloContainer.innerHTML = "<p>Il tuo carrello è vuoto.</p>";
        document.getElementById("totaleOrdine").textContent = "Totale: €0.00";
        totaleSenzaSconto= 0;
        return;
    }

    let html = "<div class='carrello-lista'>";
    let totale = 0;

    items.forEach(item => {
        const subtotale = item.price * item.quantity;
        totale += subtotale;

        html += `
          <div class="carrello-item">
            <img src="immagini/${item.image_url}" alt="${item.name}" />
            <h3>${item.name}</h3>
            <p>Prezzo: €${Number(item.price).toFixed(2)}</p>
            <p>Quantità: 
              <input 
                type="number" 
                class="carrello-quantita" 
                data-id="${item.product_id}" 
                min="1" 
                max="10" 
                value="${item.quantity}" 
                ${item.quantity == 0 ? "disabled" : ""}
              />
            </p>
            <button class="rimuovi-btn" data-id="${item.product_id}">Rimuovi</button>
          </div>
        `;
    });

    html += "</div>";
    carrelloContainer.innerHTML = html;


     totaleSenzaSconto = totale;
     aggiornaTotale();
   

    // Eventi su input quantità e rimuovi
    document.querySelectorAll(".carrello-quantita").forEach(input => {
        input.addEventListener("change", () => {
            const id = input.dataset.id;
            const qty = parseInt(input.value);
            aggiornaQuantitaCarrello(id, qty);
        });
    });

    document.querySelectorAll(".rimuovi-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            rimuoviDalCarrello(id);
        });
    });
}


function aggiornaQuantitaCarrello(productId, quantity) {
    fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity })
    })
        .then(res => res.json())
        .then(() => caricaCarrello());
}

function rimuoviDalCarrello(productId) {
    fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId })
    })
        .then(res => res.json())
        .then(() => caricaCarrello());
}

function aggiornaTotale() {
  const totaleElement = document.getElementById("totaleOrdine");
  if (totaleSenzaSconto === 0) {
    totaleElement.textContent = "Totale: €0.00";
    return;
  }

  if (scontoPercentuale > 0) {
    const scontoValore = (totaleSenzaSconto * scontoPercentuale) / 100;
    const totaleFinale = totaleSenzaSconto - scontoValore;

    totaleElement.textContent = `Totale: €${totaleFinale.toFixed(2)} (sconto applicato: -${scontoPercentuale}%)`;
  } else {
    totaleElement.textContent = `Totale: €${totaleSenzaSconto.toFixed(2)}`;
  }
}


  

const btn = document.getElementById("confermaOrdine");
  btn.addEventListener("click", async () => {
    const nazione = document.getElementById("nazione").value.trim();
    const citta = document.getElementById("citta").value.trim();
    const via = document.getElementById("via").value.trim();

    const cartaNome = document.getElementById("cartaNome").value.trim();
    const numeroCarta = document.getElementById("numeroCarta").value.trim();
    const scadenza = document.getElementById("scadenza").value.trim();
    const cvc = document.getElementById("cvc").value.trim();

    const codiceSconto = document.getElementById("codiceSconto").value.trim();

    // Validazioni minime lato client (puoi aggiungere meglio)
    if (!nazione || !citta || !via || !cartaNome || !numeroCarta || !scadenza || !cvc) {
      alert("Compila tutti i campi di spedizione e pagamento.");
      return;
    }

    try {
      const res = await fetch("/api/order/confirm", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nazione, citta, via,
          cartaNome, numeroCarta, scadenza, cvc,
          codiceSconto: scontoPercentuale > 0 ? document.getElementById("codiceSconto").value.trim() : null
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Ordine confermato con successo!");
        // eventualmente redirect o reset pagina
        window.location.href = "/ordini.html"; // o pagina conferma
      } else {
        alert("Errore: " + data.message);
      }
    } catch (e) {
      alert("Errore di rete o server.");
      console.error(e);
    }
  });

 let scontoPercentuale = 0;

document.getElementById("applicaSconto").addEventListener("click", async (e) => {
  e.preventDefault();

  const codice = document.getElementById("codiceSconto").value.trim();
  const messaggio = document.getElementById("scontoMessaggio");

  if (!codice) {
    messaggio.textContent = "Inserisci un codice sconto.";
    messaggio.style.color = "red";
    scontoPercentuale = 0;
    aggiornaTotale();
    return;
  }

  try {
    const res = await fetch(`/api/discount/validate?code=${encodeURIComponent(codice)}`);
    const data = await res.json();

    if (data.success) {
      messaggio.textContent = `Codice valido! Sconto del ${data.discount_percent}% applicato.`;
      messaggio.style.color = "green";
      scontoPercentuale = parseFloat(data.discount_percent);
      aggiornaTotale();
    } else {
      messaggio.textContent = data.message || "Codice sconto non valido.";
      messaggio.style.color = "red";
      scontoPercentuale = 0;
      aggiornaTotale();
    }
  } catch (err) {
    messaggio.textContent = "Errore di connessione.";
    messaggio.style.color = "red";
    scontoPercentuale = 0;
    aggiornaTotale();
  }
});
});