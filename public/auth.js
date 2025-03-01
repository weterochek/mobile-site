// Переключение между формами
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

// Обработчик регистрации
const registerForm = document.querySelector("#registerForm form");
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch("https://mobile-site.onrender.com/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert("Регистрация прошла успешно! Вы можете войти.");
            showLogin();
        } else {
            alert(data.message || "Ошибка регистрации.");
        }
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        alert("Произошла ошибка. Попробуйте снова.");
    }
});

// Обработчик входа
const loginForm = document.querySelector("#loginForm form");
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("https://mobile-site.onrender.com/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("username", username);
            alert("Вы успешно вошли в систему!");
            window.location.href = "/index.html";
        } else {
            alert(data.message || "Ошибка входа.");
        }
    } catch (error) {
        console.error("Ошибка входа:", error);
        alert("Произошла ошибка. Попробуйте снова.");
    }
});

// Функция обновления токена
async function refreshAccessToken() {
    console.log("Попытка обновления токена...");
    try {
        const response = await fetch("https://mobile-site.onrender.com/refresh", {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
            console.log("Токен успешно обновлён:", data.accessToken);
            localStorage.setItem("token", data.accessToken);
            return data.accessToken;
        } else {
            console.log("Ошибка при обновлении токена:", data);
            logout();
            return null;
        }
    } catch (error) {
        console.error("Ошибка запроса на обновление токена:", error);
        logout();
        return null;
    }
}

// Автообновление токена каждые 5 минут
setInterval(refreshAccessToken, 5 * 60 * 1000);

// Функция выхода
function logout() {
    fetch("https://mobile-site.onrender.com/logout", { method: "POST", credentials: "include" })
        .then(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("cart");
            sessionStorage.clear();

            document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;";

            window.location.href = "/login.html";
        })
        .catch((error) => console.error("Ошибка выхода:", error));
}

// Функция запроса с авторизацией
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("token");

    let response = await fetch(url, {
        ...options,
        credentials: "include", // Включаем куки
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status === 401) {
        token = await refreshAccessToken();
        if (!token) return response;

        response = await fetch(url, {
            ...options,
            credentials: "include",
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
        });
    }

    return response;
}

// Функция добавления товара в корзину
async function addToCart(productId, quantity) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Пожалуйста, войдите в аккаунт, чтобы добавить товар в корзину.");
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetchWithAuth("https://makadamia.onrender.com/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
        });

        const data = await response.json();

        if (response.status === 401) {
            alert("Вы не авторизованы! Войдите, чтобы добавить товар.");
            localStorage.removeItem("token");
            window.location.href = "/login.html";
            return;
        }

        if (response.ok) {
            alert("Товар добавлен в корзину!");
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Ошибка добавления в корзину:", error);
        alert("Произошла ошибка. Попробуйте снова.");
    }
}
