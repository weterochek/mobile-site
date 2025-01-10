function showRegister() {
    // Переключаем видимость форм
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("loginForm").classList.add("hidden");

    // Переключаем активные кнопки
    document.getElementById("toggleRegister").classList.add("active");
    document.getElementById("toggleLogin").classList.remove("active");
}

function showLogin() {
    // Переключаем видимость форм
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");

    // Переключаем активные кнопки
    document.getElementById("toggleLogin").classList.add("active");
    document.getElementById("toggleRegister").classList.remove("active");
}

// Устанавливаем начальный вид (форма входа по умолчанию)
document.addEventListener("DOMContentLoaded", () => {
    showLogin();
});

const registerForm = document.getElementById("registerForm").querySelector("form");
const loginForm = document.getElementById("loginForm").querySelector("form");

// Регистрация
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const response = await fetch("https://makadamia.onrender.com/register", { // Замените localhost на публичный URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.text();
    alert(data);

    if (response.ok) {
      // Сохранение имени пользователя в localStorage после регистрации
      localStorage.setItem("username", username);
      // Перенаправление на index.html после успешной регистрации
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    alert("Ошибка регистрации");
  }
});

// Авторизация
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("https://makadamia.onrender.com/login", { // Замените localhost на публичный URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.text();
    alert(data);

    if (response.ok) {
      // Сохранение имени пользователя в localStorage после авторизации
      localStorage.setItem("username", username);
      // Перенаправление на index.html после успешной авторизации
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    alert("Ошибка авторизации");
  }
});
