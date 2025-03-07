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
    e.preventDefault(); // Останавливаем отправку формы по умолчанию

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
            showLogin(); // Переключаемся на форму входа
        } else {
            alert(data.message || "Ошибка регистрации.");
        }
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        alert("Произошла ошибка. Попробуйте снова.");
    }
});
// Функция обновления токена
async function refreshAccessToken() {
    try {
        console.log("🔄 Запрос на обновление токена...");
        const response = await fetch("https://mobile-site.onrender.com/refresh", {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ Токен успешно обновлён!");
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("sharedAccessToken", data.accessToken);
            window.dispatchEvent(new Event("storage")); // 🔄 Обновляем токен во всех вкладках
            return data.accessToken;
        } else {
            console.warn("❌ Ошибка обновления токена. Выход...");
            logout();
            return null;
        }
    } catch (error) {
        console.error("❌ Ошибка при обновлении токена:", error);
        logout();
        return null;
    }
}

// Таймер автообновления токена (каждую минуту)
setInterval(() => { 
    const token = localStorage.getItem("token"); 
    if (!token) return;

    const exp = getTokenExp(token);
    const now = Math.floor(Date.now() / 1000);

    // 🔄 Обновляем за 5 минут до истечения
    if (exp && (exp - now) < 300) { 
        console.log("🔄 Токен скоро истечёт, обновляем...");
        refreshAccessToken();
    }
}, 60000);

// Обновлённая функция fetchWithAuth
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("token");

    if (!token) {
        console.warn("❌ Нет accessToken, пробуем обновить...");
        token = await refreshAccessToken();
        if (!token) return null;
    }

    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status === 401) {
        console.warn("🔄 Токен истёк, пробуем обновить...");
        token = await refreshAccessToken();
        if (!token) return response;

        return fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
        });
    }

    return response;
}

// Функция выхода из системы
function logout() {
    console.log("🚪 Выход из аккаунта...");

    fetch("https://mobile-site.onrender.com/logout", { 
        method: "POST", 
        credentials: "include" 
    }).then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("sharedAccessToken");
        localStorage.removeItem("cart");
        sessionStorage.clear();

        // Очищаем refreshToken
        document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;";

        window.dispatchEvent(new Event("storage")); // 🔄 Обновляем logout на всех вкладках
        window.location.href = "/login.html";
    }).catch((error) => console.error("Ошибка выхода:", error));
}

// 📢 Слушаем изменения токена в localStorage (другие вкладки и сайты)
window.addEventListener("storage", (event) => {
    if (event.key === "sharedAccessToken") {
        const newToken = localStorage.getItem("sharedAccessToken");
        if (newToken) {
            localStorage.setItem("token", newToken);
            console.log("🔄 Токен обновлён через localStorage:", newToken);
        }
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
            credentials: "include", // Включаем куки
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("username", username);

            // Редирект без всплывающего окна
            window.location.href = "/index.html";
        } else {
            alert(data.message || "Ошибка входа.");
        }
    } catch (error) {
        console.error("Ошибка входа:", error);
        alert("Произошла ошибка. Попробуйте снова.");
    }
});

async function addToCart(productId, quantity) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Пожалуйста, войдите в аккаунт, чтобы добавить товар в корзину.");
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("https://mobile-site.onrender.com/cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity }),
        });

        const data = await response.json();

        if (response.status === 401) {
            alert("Вы не авторизованы! Войдите, чтобы добавить товар.");
            localStorage.removeItem("token"); // Очищаем токен, если он недействителен
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

// Функция обновления токена
async function refreshAccessToken() {
    try {
        const response = await fetch("https://mobile-site.onrender.com/refresh", {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.accessToken);
            return data.accessToken;
        } else {
            logout(); // Если refreshToken недействителен, выходим из аккаунта
            return null;
        }
    } catch (error) {
        console.error("Ошибка обновления токена:", error);
        logout(); // Если произошла ошибка, выходим
        return null;
    }
}

function logout() {
    fetch("https://mobile-site.onrender.com/logout", { method: "POST", credentials: "include" })
        .then(() => {
            localStorage.removeItem("token"); // Удаляем токен
            localStorage.removeItem("cart");  // Удаляем корзину
            sessionStorage.clear(); // Очищаем сессию

            // Очищаем refreshToken
            document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;";

            window.location.href = "/login.html"; // Перенаправляем на страницу входа
        })
        .catch((error) => console.error("Ошибка выхода:", error));
}

// Функция запроса с авторизацией
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("token");

    let response = await fetch(url, {
        ...options,
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
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
        });
    }

    return response;
}

window.addEventListener("storage", (event) => {
    if (event.key === "sharedAccessTokenUpdate") {
        const newToken = localStorage.getItem("sharedAccessToken");
        if (newToken) {
            localStorage.setItem("token", newToken);
            console.log("Токен обновлён через localStorage:", newToken);
        }
    }
});
