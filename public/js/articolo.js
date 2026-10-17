document.addEventListener("DOMContentLoaded", async () => {

  function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // o il nome del parametro che stai usando nell'URL
}
  const container = document.getElementById("articoloContainer");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

 
  if (!id) {
    container.innerHTML = "<p>Prodotto non trovato.</p>";
    return;
  }



  try {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();

    if (!data.success || !data.product) {
      container.innerHTML = "<p>Prodotto non trovato o errore nel caricamento.</p>";
      return;
    }

    const product = data.product;
    const imageSrc = `/immagini/${product.image_url}`;

  container.innerHTML = `
      <div class="articolo-dettaglio">
        <h1>${product.name}</h1>
        <div class="immagine-articolo">
          <img src="${imageSrc}" alt="${product.name}" />
        </div>
        <div class="info-articolo">
          <p class="descrizione"><strong>Descrizione: </strong>${product.description || "Nessuna descrizione."}</p>

          ${
  product.discount_price && product.discount_price > 0
    ? `<p class="prezzo"><strong>Prezzo:</strong> 
          <span class="old-price">€${Number(product.price).toFixed(2)}</span> 
          <span class="discounted-price">€${Number(product.discount_price).toFixed(2)}</span>
       </p>`
    : `<p class="prezzo"><strong>Prezzo:</strong> €${Number(product.price).toFixed(2)}</p>`
}



          <p><strong>Quantità disponibile:</strong> ${product.quantity}</p>

          <label for="quantita">Quantità:</label>
          <input 
            type="number" 
            id="quantita" 
            name="quantita" 
            value="1" 
            min="1" 
            max="${product.quantity}" 
            ${product.quantity === 0 ? "disabled" : ""}
          />

          <button class="buy-btn"  data-id="${product.id}" ${product.quantity === 0 ? "disabled" : ""}>
            Aggiungi al carrello
          </button>
           
        </div>
      </div>
    `;

  } catch (err) {
    console.error("Errore nel caricamento del prodotto:", err);
    container.innerHTML = "<p>Errore nel caricamento del prodotto.</p>";
  }

  const buyBtn = document.querySelector(".buy-btn");
const qtyInput = document.getElementById("quantita");

if (buyBtn) {
  buyBtn.addEventListener("click", () => {
    const productId = buyBtn.dataset.id;
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    if (quantity < 1 || isNaN(quantity)) {
      alert("Inserisci una quantità valida");
      return;
    }

    aggiungiAlCarrello(productId, quantity);
  });
}



const productId = getProductIdFromURL(); // funzione per recuperare l'ID prodotto dalla URL

// Carica le recensioni
fetch(`/api/reviews?product_id=${productId}`)
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('recensioni-list');
    if (data.success && data.reviews.length > 0) {
      data.reviews.forEach(r => {
        const div = document.createElement('div');
        div.className = "review";
        div.innerHTML = `<strong> Utente: ${r.nome} ${r.cognome}</strong><br>
                         <small> In data: ${new Date(r.created_at).toLocaleDateString()}</small>
                         <p>${r.review_text}</p>`;
        list.appendChild(div);
      });
    } else {
      list.innerHTML = "<p>Nessuna recensione per questo prodotto.</p>";
    }
  });

// Invia recensione
document.getElementById("form-recensione").addEventListener("submit", function(e) {
  e.preventDefault();
  const reviewText = document.getElementById("review_text").value;

  fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, reviewText }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Recensione inviata!");
      location.reload();
    } else {
      alert("Errore: " + data.message);
    }
  });
});

});
