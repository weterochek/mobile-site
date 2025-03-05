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


// Обработчик входа
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("https://makadamia.onrender.com/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include", // 🔹 ОБЯЗАТЕЛЬНО, чтобы получить refreshToken
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("username", username);
            console.log("✅ Успешный вход!");

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
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch("https://makadamia.onrender.com/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include", // 🔹 Нужно для получения refreshToken
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Регистрация успешна, авторизуем пользователя...");

            // 🔹 Автоматически логиним пользователя после регистрации
            const loginResponse = await fetch("https://makadamia.onrender.com/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: "include",
            });

            const loginData = await loginResponse.json();
            if (loginResponse.ok) {
                localStorage.setItem("token", loginData.accessToken);
                localStorage.setItem("username", username);
                console.log("✅ Автоматический вход выполнен!");

                window.location.href = "/index.html"; // 🔹 Перенаправляем на главную
            } else {
                alert(loginData.message || "Ошибка автоматического входа.");
            }
        } else {
            alert(data.message || "Ошибка регистрации.");
        }
    } catch (error) {
        console.error("Ошибка регистрации:", error);
        alert("Произошла ошибка. Попробуйте снова.");
    }
});
async function refreshAccessToken() {
    try {
        const response = await fetch("https://makadamia.onrender.com/refresh", {
            method: "POST",
            credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.accessToken);
            return data.accessToken;
        } else {
            console.warn("Ошибка обновления токена, требуется повторный вход.");
            logout();
            return null;
        }
    } catch (error) {
        console.error("Ошибка при обновлении токена:", error);
        logout();
        return null;
    }
}
// Автообновление токена каждые 5 минут
setInterval(async () => {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
        console.log("🔄 Токен устарел, обновляем...");
        await refreshAccessToken();
    }
}, 5 * 60 * 1000); // Проверка каждые 5 минут
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return (Date.now() / 1000) >= payload.exp;
    } catch (e) {
        return true;
    }
}
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
