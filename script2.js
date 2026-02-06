document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("loginOverlay");
  const app = document.getElementById("app");
  const userNameEl = document.getElementById("userName");

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("rightbarLogoutBtn");

  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");

  // 🚨 HARD SAFETY CHECK
  if (!overlay || !app) {
    console.error("❌ loginOverlay or app missing");
    return;
  }

  // ======================
  // LOGIN GATE FUNCTION
  // ======================
  function lockApp() {
    overlay.style.display = "flex";
    app.style.filter = "blur(6px)";
    app.style.pointerEvents = "none";
  }

  function unlockApp(name) {
    overlay.style.display = "none";
    app.style.filter = "none";
    app.style.pointerEvents = "auto";
    if (userNameEl && name) userNameEl.textContent = name;
  }

  // ======================
  // INITIAL CHECK
  // ======================
  const storedName = localStorage.getItem("userName");

  if (!storedName) {
    lockApp();
  } else {
    unlockApp(storedName);
  }

  // ======================
  // LOGIN
  // ======================
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault(); // ⛔ prevent page reload

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();

      if (!name || !email) {
        alert("Please enter name and email");
        return;
      }

      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);

      unlockApp(name);
    });
  }

  // ======================
  // LOGOUT
  // ======================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.clear();

      if (userNameEl) userNameEl.textContent = "Good Day!";
      if (nameInput) nameInput.value = "";
      if (emailInput) emailInput.value = "";

      lockApp();
    });
  }
});
