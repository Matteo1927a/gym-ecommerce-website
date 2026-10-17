
document.addEventListener("DOMContentLoaded", async () => {

document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    nome: document.getElementById("nome").value,
    cognome: document.getElementById("cognome").value,
    email: document.getElementById("email").value,
    telefono: document.getElementById("telefono").value,
    messaggio: document.getElementById("messaggio").value,
    terms: document.getElementById("terms").checked,
    gdpr: document.getElementById("gdpr").checked,
  };

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (data.success) {
      alert("Messaggio inviato con successo!");
      document.getElementById("contactForm").reset();
    } else {
      alert("Errore: " + data.message);
    }
  } catch (error) {
    console.error("Errore invio messaggio:", error);
    alert("Errore durante l'invio del messaggio.");
  }
});
});

