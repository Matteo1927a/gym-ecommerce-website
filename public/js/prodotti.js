document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("productList");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  let allProducts = [];

  async function caricaProdotti() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      if (!data.success) throw new Error("Errore nel caricamento prodotti");

      allProducts = data.products;
      popolaCategorie(allProducts);
      mostraProdotti(allProducts);
    } catch (err) {
      console.error(err);
      productList.innerHTML = "<p>Errore nel caricamento dei prodotti.</p>";
    }
  }

  function mostraProdotti(prodotti) {
    productList.innerHTML = "";

    if (prodotti.length === 0) {
      productList.innerHTML = "<p>Nessun prodotto trovato.</p>";
      return;
    }

   prodotti.forEach(p => {
  const div = document.createElement("div");
  div.classList.add("prodotto-card");

  div.innerHTML = `
    <a href="Articolo.html?id=${p.id}">
      <img src="immagini/${p.image_url}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">
       ${p.discount_price && p.discount_price > 0
  ? `<span class="old-price">€${Number(p.price).toFixed(2)}</span> 
     <span class="discounted-price">€${Number(p.discount_price).toFixed(2)}</span>`
  : `€${Number(p.price).toFixed(2)}`
}
      </p>
      <p class="category">${p.category || 'N/A'}</p>
    </a>
    <button class="buy-btn" data-id="${p.id}">Aggiungi al carrello</button>
     
  `;

  productList.appendChild(div);
});

  document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    aggiungiAlCarrello(id, 1);
  });
});

}




  function popolaCategorie(prodotti) {
    const categorie = new Set();
    prodotti.forEach(p => {
      if (p.category) categorie.add(p.category);
    });

    categorie.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });
  }

  function filtraProdotti() {
    const ricerca = searchInput.value.toLowerCase();
    const categoria = categoryFilter.value;

    const filtrati = allProducts.filter(p => {
      const matchNome = p.name.toLowerCase().includes(ricerca);
      const matchCategoria = !categoria || p.category === categoria;
      return matchNome && matchCategoria;
    });

    mostraProdotti(filtrati);
  }


  searchInput.addEventListener("input", filtraProdotti);
  categoryFilter.addEventListener("change", filtraProdotti);

  caricaProdotti();

});


