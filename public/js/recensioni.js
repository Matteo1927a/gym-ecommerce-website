document.addEventListener("DOMContentLoaded", async () => {
  const categoriaSelect = document.getElementById("filtro-categoria");
  const ordineSelect = document.getElementById("filtro-ordine");
  const lista = document.getElementById("recensioni-list");

  async function fetchCategorie() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success) {
      data.categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.name;
        option.textContent = cat.name;
        categoriaSelect.appendChild(option);
      });
    }
  }

async function fetchRecensioni() {
  const categoria = categoriaSelect.value;
  const ordine = ordineSelect.value;

  const url = new URL("/api/reviews", window.location.origin);
  if (categoria) url.searchParams.set("category", categoria);
  if (ordine) url.searchParams.set("order", ordine);

  // Aggiungi questo per ottenere info dettagliate
  url.searchParams.set("detailed", "true");

  const res = await fetch(url);
  const data = await res.json();

  lista.innerHTML = "";

  if (data.success && data.reviews.length) {
    data.reviews.forEach(r => {
      const div = document.createElement("div");
      div.classList.add("recensione");

      div.innerHTML = `
        <div class="intestazione-prodotto">
          <a href="/articolo.html?id=${r.product_id}" class="link-prodotto">
          <img src="/immagini/${r.image_url}" alt="${r.product_name}" class="img-prodotto" />
          <h3 class="nome-prodotto">${r.product_name}</h3>
        </div>
        <p class="autore"><strong>${r.nome} ${r.cognome}</strong> – 
          <span class="data">${new Date(r.created_at).toLocaleDateString()}</span>
        </p>
        <p class="categoria">${r.category_name}</p>
        <p class="testo">${r.review_text}</p>
      `;
      lista.appendChild(div);
    });
  } else {
    lista.innerHTML = "<p>Nessuna recensione trovata.</p>";
  }
}

  categoriaSelect.addEventListener("change", fetchRecensioni);
  ordineSelect.addEventListener("change", fetchRecensioni);

  await fetchCategorie();
  await fetchRecensioni();
});