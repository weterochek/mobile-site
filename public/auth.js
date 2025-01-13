function showRegister() {
  document.getElementById("registerForm").classList.add("active");
  document.getElementById("loginForm").classList.remove("active");

  document.getElementById("toggleRegister").classList.add("active");
  document.getElementById("toggleLogin").classList.remove("active");
}

function showLogin() {
  document.getElementById("loginForm").classList.add("active");
  document.getElementById("registerForm").classList.remove("active");

  document.getElementById("toggleLogin").classList.add("active");
  document.getElementById("toggleRegister").classList.remove("active");
}

// Показ формы авторизации по умолчанию
showLogin();

const registerForm = document.getElementById("registerForm").querySelector("form");
const loginForm = document.getElementById("loginForm").querySelector("form");

// Регистрация
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const response = await fetch("https://makadamia.onrender.com/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Ошибка регистрации");
    }

    alert(data.message || "Регистрация успешна");

    // Сохранение имени пользователя и редирект
    localStorage.setItem("username", username);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    alert(error.message || "Ошибка регистрации");
  }
});

// Авторизация
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("https://makadamia.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Ошибка авторизации");
    }

    alert(data.message || "Авторизация успешна");

    // Сохранение токена и редирект
    localStorage.setItem("token", data.token); // Сохраняем токен
    localStorage.setItem("username", username);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    alert(error.message || "Ошибка авторизации");
  }
});
