document.addEventListener("DOMContentLoaded", checkAuthStatus);

async function checkAuthStatus() {
  try {
    const response = await fetch("/api/userinfo", { credentials: "include" });
    if (!response.ok) throw new Error("Non autenticato");

    const data = await response.json();
    const authButton = document.getElementById("loginBtn");

    if (authButton) {
      if (data.success) {
        if (data.is_admin) {
          authButton.textContent = "Admin";
          authButton.onclick = () => window.location.href = "/admin/admin.html";
        } else {
          authButton.textContent = "Profilo";
          authButton.onclick = () => window.location.href = "/private/profilo.html";
        }
      } else {
        authButton.textContent = "Accedi";
        authButton.onclick = () => window.location.href = "/login_register.html";
      }
    }
  } catch {
    const authButton = document.getElementById("loginBtn");
    if (authButton) {
      authButton.textContent = "Accedi";
      authButton.onclick = () => window.location.href = "/login_register.html";
    }
  }
}
