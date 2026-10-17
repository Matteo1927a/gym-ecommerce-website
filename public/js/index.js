document.addEventListener('DOMContentLoaded', () => {
  // --- Background dinamico ---
  const backgroundImages = [
    'immagini/sfondo.jpg',
    'immagini/sfondo2.jpg',
    'immagini/sfondo3.jpg',
    'immagini/sfondo4.jpg'
  ];

  let currentIndex = 0;
  const box1 = document.querySelector('.box_1');
  const nextBgBtn = document.getElementById('next');
  const prevBgBtn = document.getElementById('prev');

  function updateBackground() {
    const imgUrl = backgroundImages[currentIndex];
    if (box1) box1.style.backgroundImage = `url(${imgUrl})`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % backgroundImages.length;
    updateBackground();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + backgroundImages.length) % backgroundImages.length;
    updateBackground();
  }

  let autoSlide = setInterval(nextImage, 5000);

  function resetInterval() {
    clearInterval(autoSlide);
    autoSlide = setInterval(nextImage, 5000);
  }

  if (nextBgBtn && prevBgBtn && box1) {
    nextBgBtn.addEventListener('click', () => {
      nextImage();
      resetInterval();
    });

    prevBgBtn.addEventListener('click', () => {
      prevImage();
      resetInterval();
    });

    updateBackground();
  }

  // --- Carousel prodotti in evidenza ---
  const featuredTrack = document.getElementById('featuredCarousel');
  const prevFeaturedBtn = document.getElementById('prevBtn');
  const nextFeaturedBtn = document.getElementById('nextBtn');

  // --- Carousel prodotti in sconto ---
  const saleTrack = document.getElementById('saleCarousel');
  const prevSaleBtn = document.getElementById('prevSaleBtn');
  const nextSaleBtn = document.getElementById('nextSaleBtn');

  let featuredPosition = 0;
  let salePosition = 0;
  const productsPerPage = 2; // in base al CSS (2 card per riga)

  // --- Fetch prodotti in evidenza ---
  async function fetchFeaturedProducts() {
    try {
      const response = await fetch('/api/products/featured');
      const data = await response.json();
      if (data.success) {
        renderProducts(data.products, 'featuredCarousel');
        updateCarouselButtons('featured');
      }
    } catch (error) {
      console.error('Errore fetch prodotti in evidenza:', error);
    }
  }

  // --- Fetch prodotti in sconto ---
  async function fetchDiscountedProducts() {
    try {
      const response = await fetch('/api/products/discounted');
      const data = await response.json();
      if (data.success) {
        renderProducts(data.products, 'saleCarousel');
        updateCarouselButtons('sale');
      }
    } catch (error) {
      console.error('Errore fetch prodotti in sconto:', error);
    }
  }

  // --- Funzione di rendering generica ---
  function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // pulisco

    products.forEach(product => {
      const hasDiscount = product.discount_price !== null && product.discount_price !== 0.00 && product.discount_price < product.price;
      const card = document.createElement('div');
      card.classList.add('product-card');

      card.innerHTML = `
        <div class="image-wrapper">
          <img src="immagini/${product.image_url}" alt="${product.name}" />
          ${hasDiscount ? `<div class="badge">20%</div>` : ''}
        </div>
        <h3>${product.name}</h3>
       <div class="price">
  ${product.discount_price && product.discount_price > 0 
    ? `<span class="old-price">€${Number(product.price).toFixed(2)}</span> 
       <span class="discounted-price">€${Number(product.discount_price).toFixed(2)}</span>`
    : `€${Number(product.price).toFixed(2)}`
  }
</div>
`;

container.appendChild(card);
card.addEventListener('click', () => {
  window.location.href = `/articolo.html?id=${product.id}`;
});
        });
}
  

  // --- Funzione per aggiornare lo stato dei bottoni carousel ---
  function updateCarouselButtons(type) {
    let track, prevBtn, nextBtn, position, productsCount;

    if(type === 'featured') {
      track = featuredTrack;
      prevBtn = prevFeaturedBtn;
      nextBtn = nextFeaturedBtn;
      position = featuredPosition;
      productsCount = track.children.length;
    } else if(type === 'sale') {
      track = saleTrack;
      prevBtn = prevSaleBtn;
      nextBtn = nextSaleBtn;
      position = salePosition;
      productsCount = track.children.length;
    }

    const maxPosition = Math.max(productsCount - productsPerPage, 0);

    // Disabilita/abilita bottoni
    if(position <= 0) {
      prevBtn.disabled = true;
    } else {
      prevBtn.disabled = false;
    }

    if(position >= maxPosition) {
      nextBtn.disabled = true;
    } else {
      nextBtn.disabled = false;
    }

    // Trasla il track
    const translateX = -(position * (track.children[0]?.offsetWidth + 20)); // 20 è il gap CSS
    track.style.transform = `translateX(${translateX}px)`;
  }

  // --- Eventi click carousel prodotti in evidenza ---
  if(prevFeaturedBtn && nextFeaturedBtn && featuredTrack) {
    prevFeaturedBtn.addEventListener('click', () => {
      if(featuredPosition > 0) {
        featuredPosition--;
        updateCarouselButtons('featured');
      }
    });

    nextFeaturedBtn.addEventListener('click', () => {
      if(featuredPosition < featuredTrack.children.length - productsPerPage) {
        featuredPosition++;
        updateCarouselButtons('featured');
      }
    });
  }

  // --- Eventi click carousel prodotti in sconto ---
  if(prevSaleBtn && nextSaleBtn && saleTrack) {
    prevSaleBtn.addEventListener('click', () => {
      if(salePosition > 0) {
        salePosition--;
        updateCarouselButtons('sale');
      }
    });

    nextSaleBtn.addEventListener('click', () => {
      if(salePosition < saleTrack.children.length - productsPerPage) {
        salePosition++;
        updateCarouselButtons('sale');
      }
    });
  }

  // --- Fetch per la barra di ricerca ---
  const searchInput = document.querySelector('.search-bar input');
  const suggestionsList = document.querySelector('.suggestions-list');

  async function fetchSearchSuggestions(query) {
    if (!query) {
      suggestionsList.style.display = 'none';
      suggestionsList.innerHTML = '';
      return;
    }

    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        renderSearchSuggestions(data.results);
      }
    } catch (error) {
      console.error('Errore fetch ricerca:', error);
    }
  }

  function renderSearchSuggestions(results) {
    if (results.length === 0) {
      suggestionsList.style.display = 'none';
      suggestionsList.innerHTML = '';
      return;
    }

    suggestionsList.innerHTML = results.map(item => `<li data-id="${item.id}">${item.name}</li>`).join('');
    suggestionsList.style.display = 'block';
  }

  // --- Eventi input ricerca ---
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      fetchSearchSuggestions(e.target.value);
    });

    // Clic su suggerimento (per esempio per fare redirect a pagina prodotto)
    suggestionsList.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'li') {
        const id = e.target.dataset.id;
        // Redirect al dettaglio prodotto (modifica secondo la tua struttura)
        window.location.href = `/articolo.html?id=${id}`;
      }
    });

    // Nascondi suggerimenti se clicco fuori
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.style.display = 'none';
    }
  });
}

// --- Avvio fetch dati ---
fetchFeaturedProducts();
fetchDiscountedProducts();

});