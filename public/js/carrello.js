
function aggiungiAlCarrello(productId, quantity = 1) {
  fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Prodotto aggiunto al carrello!');
    } else {
      alert('Errore: ' + data.message);
    }
  })
  .catch(err => {
    console.error('Errore fetch carrello:', err);
    alert('Errore nel contatto col server.');
  });
}
