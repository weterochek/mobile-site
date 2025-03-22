let productMap = {};// Будет заполнен динамически
let cart = JSON.parse(localStorage.getItem('cart')) || {};
window.onload = function() {
  const userAgent = navigator.userAgent.toLowerCase();

  // Логирование для проверки, что передается в User-Agent
  console.log("User-Agent: ", userAgent);

  if (userAgent.includes('mobile')) {
    // Перенаправление на мобильную версию сайта
    if (!window.location.href.includes('mobile-site.onrender.com')) {
      window.location.href = "https://mobile-site.onrender.com";
    }
  } else {
    // Перенаправление на десктопную версию сайта
    if (!window.location.href.includes('makadamia.onrender.com')) {
      window.location.href = "https://makadamia.onrender.com";
    }
  }
};
async function loadProductMap() {
    try {
        const response = await fetch('https://mobile-site.onrender.com/api/products');
        const products = await response.json();
        products.forEach(product => {
            productMap[product._id] = { name: product.name, price: product.price };
        });
        console.log("✅ Product Map загружен:", productMap);
    } catch (error) {
        console.error("Ошибка загрузки productMap:", error);
    }
}
window.onload = function () {
    // Вызов updateControls для всех товаров в корзине
    for (const productId in cart) {
        updateControls(productId);
    }
    updateCartDisplay();
};
console.log("Отправка запроса на /refresh");
console.log("Токен перед запросом:", localStorage.getItem("token"));

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
        console.log("🔄 Обновляем токен при входе на сайт...");
        await refreshAccessToken();
    }

    const cartButton = document.getElementById("cartButton");
    const cartDropdown = document.getElementById("cartDropdown");

    if (cartButton && cartDropdown) {
        cartButton.addEventListener("click", function (event) {
            event.stopPropagation();
            cartDropdown.style.display = cartDropdown.style.display === "block" ? "none" : "block";
        });

        // Закрытие корзины при клике на крестик
        const closeCartButton = document.createElement("span");
        closeCartButton.innerHTML = "✖";
        closeCartButton.style.cursor = "pointer";
        closeCartButton.style.position = "absolute";
        closeCartButton.style.top = "10px";
        closeCartButton.style.right = "10px";
        closeCartButton.style.fontSize = "1.2em";
        closeCartButton.style.color = "black";
        closeCartButton.addEventListener("click", function (event) {
            event.stopPropagation();
            cartDropdown.style.display = "none";
        });

        cartDropdown.prepend(closeCartButton);
    } else {
        console.warn("❌ cartButton или cartDropdown не найдены!");
    }
});
// Закрытие корзины при клике вне корзины (но не на товарах)
document.addEventListener("click", function (event) {
    const cartDropdown = document.getElementById('cartDropdown');
    if (cartDropdown && !cartDropdown.contains(event.target) && !event.target.closest("#cartButton") && !event.target.closest(".cart-item")) {
        cartDropdown.style.display = 'none'; // Скрыть корзину, если клик был вне корзины и её элементов
    }
});
// Функция добавления товара в корзину
function addToCart(itemName, itemPrice) {
    if (cart[itemName]) {
        cart[itemName].quantity += 1;
    } else {
        cart[itemName] = { price: itemPrice, quantity: 1 };
    }
    saveCartToLocalStorage();
    updateCartDisplay();
    replaceAddButtonWithControls(itemName);
}
//очищение корзины
document.addEventListener('DOMContentLoaded', () => {
    const clearCartButton = document.getElementById('clear-cart');
    const cartTotal = document.getElementById('totalAmount'); // Элемент с итоговой суммой
    const cartItemsContainer = document.getElementById('cartItems'); // Контейнер товаров в корзине

    // Функция обновления отображения корзины
   function updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    cartItems.innerHTML = "";  // Очищаем список товаров
    let totalAmount = 0;

    for (const productId in cart) {
        const item = cart[productId];  // item = { name, price, quantity }
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.setAttribute("data-id", productId); // Назовём честно productId, а не name
        cartItem.innerHTML = `
            <div class="item-info">${item.name} - ${itemTotal} ₽</div>
            <div class="cart-buttons">
                <button onclick="decrementItem('${productId}')">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="incrementItem('${productId}', ${item.price})">+</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    }

    document.getElementById("totalAmount").textContent = `Итого: ${totalAmount} ₽`;

    // Если корзина пуста, скрываем её
    if (Object.keys(cart).length === 0) {
        document.getElementById("cartDropdown").style.display = "none";
    }
}
    // Очищение корзины
    if (clearCartButton) {
    clearCartButton.addEventListener('click', () => {
        const username = localStorage.getItem("username");
        if (username) {
            localStorage.removeItem(`cart_${username}`); // Удаляем корзину для текущего пользователя
        }
        localStorage.removeItem('cart'); // Если корзина также хранится под этим ключом
        updateCartDisplay(); // Обновляем корзину на странице
        cartTotal.textContent = 'Итого: 0 ₽';
    });
}

    // Инициализируем корзину при загрузке страницы
    updateCartDisplay();
});
function displayUserOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    const noOrdersMessage = document.getElementById('noOrdersMessage');

    if (orders.length === 0) {
        noOrdersMessage.style.display = 'block';
        ordersContainer.style.display = 'none';
    } else {
        noOrdersMessage.style.display = 'none';
        ordersContainer.style.display = 'block';
    }

    ordersContainer.innerHTML = '';

    orders.forEach(order => {
        const itemsList = order.items.map(item => {
            if (item.productId && item.productId.name) {
                return `<li>${item.productId.name} — ${item.quantity} шт. (${item.price} ₽)</li>`;
            } else {
                return `<li>Товар не найден</li>`;
            }
        }).join('');

        let orderHTML = `
            <div class="order">
                <h3>Заказ №${order._id.slice(0, 8)}</h3>
                <p>Адрес: ${order.address}</p>
                <p>Дата оформления: ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</p>
                <p>Время доставки: ${order.deliveryTime || 'Не указано'}</p>
                <p>Общая сумма: ${order.totalAmount} ₽</p>
        `;

        if (order.additionalInfo) {
            orderHTML += `<p>Дополнительная информация: ${order.additionalInfo}</p>`;
        }

        orderHTML += `<ul>${itemsList}</ul></div><hr>`;

        ordersContainer.innerHTML += orderHTML;
    });
}
function renderCart() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    cartItems.innerHTML = ""; // Очищаем список товаров
    let totalAmount = 0;

    for (const productId in cart) {
        const item = cart[productId]; // item = { name, price, quantity }
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.setAttribute("data-id", productId); // Назовём честно productId
        cartItem.innerHTML = `
            <div class="item-info">${item.name} - ${itemTotal} ₽</div>
            <div class="cart-buttons">
                <button onclick="decrementItem('${productId}')">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="incrementItem('${productId}', ${item.price})">+</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    }

    document.getElementById("totalAmount").textContent = `Итого: ${totalAmount} ₽`;
}

// Функции для увеличения/уменьшения количества товаров
function decrementItem(itemName) {
    if (cart[itemName]) {
        cart[itemName].quantity -= 1;

        if (cart[itemName].quantity === 0) {
            delete cart[itemName]; // ❌ Удаляем товар из объекта cart

            // Удаляем товар из корзины на странице
            const cartItemElement = document.querySelector(`.cart-item[data-name="${itemName}"]`);
            if (cartItemElement) {
                cartItemElement.remove();
            }

            revertControlsToAddButton(itemName); // Возвращаем кнопку "Добавить"
        }

        saveCartToLocalStorage(); // Сохраняем обновлённые данные
        updateCartDisplay(); // Обновляем UI корзины

        // Если корзина пуста, скрываем её
        if (Object.keys(cart).length === 0) {
            document.getElementById("cartDropdown").style.display = "none";
        }
    }
}

function incrementItem(itemName, itemPrice) {
    addToCart(itemName, itemPrice);
}
// Преобразование кнопки "Добавить" в контролы "+", "-", и количество
function replaceAddButtonWithControls(itemName) {
    const addButton = document.getElementById(`addButton_${itemName}`);
    const removeButton = document.getElementById(`removeBtn_${itemName}`);
    const addButtonControl = document.getElementById(`addBtn_${itemName}`);
    const quantityDisplay = document.getElementById(`quantity_${itemName}`);

    if (!addButton || !removeButton || !addButtonControl || !quantityDisplay) {
        console.warn(`❌ Ошибка: Не найдены элементы для ${itemName}`);
        return;
    }

    addButton.style.display = "none";
    removeButton.style.display = "inline-block";
    addButtonControl.style.display = "inline-block";
    quantityDisplay.style.display = "inline-block";
    quantityDisplay.textContent = cart[itemName].quantity;
}


// Возвращение кнопки "Добавить" вместо контролов, если товара нет в корзине
function revertControlsToAddButton(itemName) {
    const addButton = document.getElementById(`addButton_${itemName}`);
    const removeButton = document.getElementById(`removeBtn_${itemName}`);
    const addButtonControl = document.getElementById(`addBtn_${itemName}`);
    const quantityDisplay = document.getElementById(`quantity_${itemName}`);

    if (!addButton || !removeButton || !addButtonControl || !quantityDisplay) {
        console.warn(`⚠️ Ошибка: Не найдены элементы для товара ${itemName}`);
        return;
    }

    addButton.style.display = "inline-block";
    removeButton.style.display = "none";
    addButtonControl.style.display = "none";
    quantityDisplay.style.display = "none";
}
document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');  // Получаем токен из localStorage

    if (accessToken) {
        document.getElementById('authButton').textContent = 'Личный кабинет';  // Если токен есть, отображаем "Личный кабинет"
        await loadUserData(accessToken);  // Загружаем данные пользователя
    } else {
        document.getElementById('authButton').textContent = 'Вход';  // Если токен отсутствует, отображаем "Вход"
    }
});
async function loadUserData(token) {
    const response = await fetch("/account", {
        headers: {
            "Authorization": `Bearer ${token}`  // Передаем токен в заголовке
        }
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById("username").textContent = data.username;  // Отображаем имя пользователя
    } else {
        localStorage.removeItem('accessToken');  // Если токен недействителен, удаляем его
    }
}

// Обновление отображения корзины и количества товара на карточке
function updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    cartItems.innerHTML = ""; // Очищаем список товаров
    let totalAmount = 0;

    for (const item in cart) {
        const itemTotal = cart[item].price * cart[item].quantity;
        totalAmount += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.setAttribute("data-name", item); // Добавляем атрибут для поиска
        cartItem.innerHTML = `
            <div class="item-info">${item} - ${itemTotal} ₽</div>
            <div class="cart-buttons">
                <button onclick="decrementItem('${item}')">-</button>
                <span class="quantity">${cart[item].quantity}</span>
                <button onclick="incrementItem('${item}', ${cart[item].price})">+</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    }

    document.getElementById("totalAmount").textContent = `Итого: ${totalAmount} ₽`;

    // Если корзина пуста, скрываем её
    if (Object.keys(cart).length === 0) {
        document.getElementById("cartDropdown").style.display = "none";
    }
}

// Сохранение корзины в localStorage
function saveCartToLocalStorage() {
    const username = localStorage.getItem("username");

    if (username) {
        localStorage.setItem(`cart_${username}`, JSON.stringify(cart)); // Сохраняем для пользователя
    } else {
        localStorage.setItem("cart_guest", JSON.stringify(cart)); // Сохраняем для гостя
    }
}
function mergeGuestCart() {
    const username = localStorage.getItem("username");

    if (!username) return; // Если пользователь не вошел, ничего не делаем

    const guestCart = JSON.parse(localStorage.getItem("cart_guest"));
    if (!guestCart) return; // Если корзины гостя нет, просто продолжаем

    const userCart = JSON.parse(localStorage.getItem(`cart_${username}`)) || {};

    // Объединяем корзины (если товар уже есть — увеличиваем количество)
    for (const item in guestCart) {
        if (userCart[item]) {
            userCart[item].quantity += guestCart[item].quantity;
        } else {
            userCart[item] = guestCart[item];
        }
    }

    // Сохраняем объединенную корзину в localStorage и очищаем корзину гостя
    localStorage.setItem(`cart_${username}`, JSON.stringify(userCart));
    localStorage.removeItem("cart_guest");

    console.log("✅ Гостевая корзина объединена с пользовательской");
}


// Оформление заказа
function checkout() {
    alert("Ваш заказ оформлен!");
    cart = {};
    updateCartDisplay();
    resetAddToCartButtons();
    saveCartToLocalStorage();
    toggleCart();
}

// Сброс всех кнопок на исходное состояние "Добавить"
function resetAddToCartButtons() {
    for (const itemName in cart) {
        revertControlsToAddButton(itemName);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');  // Получаем токен из localStorage

    if (token) {
        // Если токен есть, показываем кнопку "Личный кабинет" и скрываем "Вход"
        document.getElementById('authButton').textContent = 'Личный кабинет';
    } else {
        // Если токен отсутствует, показываем "Вход"
        document.getElementById('authButton').textContent = 'Вход';
    }
});
// Загрузка корзины из localStorage при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    loadCartFromLocalStorage();
    const cartModal = document.getElementById("cartModal");
    if (cartModal) cartModal.style.display = "none";
});

// Функция загрузки корзины
function loadCartFromLocalStorage() {
    const username = localStorage.getItem("username");

    if (username) {
        // Загружаем корзину пользователя
        const storedCart = JSON.parse(localStorage.getItem(`cart_${username}`));
        if (storedCart) {
            cart = storedCart;
        }
    } else {
        // Если пользователь не авторизован, загружаем корзину для гостя
        const guestCart = JSON.parse(localStorage.getItem("cart_guest"));
        if (guestCart) {
            cart = guestCart;
        }
    }

    updateCartDisplay(); // Обновляем UI корзины
}
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("token");
    const fullUrl = window.location.origin + url; // ✅ Теперь запрос идёт на текущий сервер

    if (!token) {
        console.warn("❌ Нет accessToken, пробуем обновить...");
        token = await refreshAccessToken();
        if (!token) return null;
    }

    let res = await fetch(fullUrl, {
        ...options,
        credentials: "include",
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    if (res.status === 401) {
        console.warn("🔄 Токен истёк, пробуем обновить...");
        token = await refreshAccessToken();
        if (!token) return res;

        return fetch(fullUrl, {
            ...options,
            credentials: "include",
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`
            }
        });
    }

    return res;
}


function getTokenExp(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp;
    } catch (e) {
        return null;
    }
}


async function refreshAccessToken() {
    console.log("🔄 Запрос на обновление токена...");

    const response = await fetch("/refresh", {
        method: "POST",
        credentials: "include"  // 🔥 Передаёт куки, даже если они httpOnly
    });

    const data = await response.json();
    if (response.ok) {
        console.log("✅ Токен успешно обновлён!");
        localStorage.setItem("accessToken", data.accessToken);
        return data.accessToken;
    } else {
        console.warn("❌ Ошибка обновления токена:", data.message);
        return null;
    }
}
// Функция для получения значения cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}




// ✅ Добавляем обработчик выхода (если `logout()` не определён)
function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("cart_guest"); // Очищаем корзину гостя
    sessionStorage.clear();
    document.cookie = "refreshTokenDesktop=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "refreshTokenMobile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = "/";
}



function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Декодируем токен
        return (Date.now() / 1000) >= payload.exp; // Проверяем срок действия
    } catch (e) {
        return true; // Если ошибка — считаем токен недействительным
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
        console.log("Пользователь не авторизован");
        return;
    }

    fetch(`https://makadamia.onrender.com/api/user-orders`, { 
    method: "GET",
    headers: {
        "Authorization": `Bearer ${token}`
    }
})
.then(res => res.json())
.then(orders => {
    const container = document.getElementById("ordersContainer");

    if (orders.length === 0) {
        container.innerHTML = "<p>У вас пока нет заказов.</p>";
        return;
    }

    // Сортируем от новых к старым
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Показываем самый последний заказ
    displayOrder(orders[0], container);

    // Логика кнопки истории
    const toggleBtn = document.getElementById('toggleHistoryBtn');
    const ordersHistory = document.getElementById('ordersHistory');

    toggleBtn.addEventListener('click', () => {
        if (ordersHistory.style.display === 'none') {
            ordersHistory.style.display = 'block';
            toggleBtn.textContent = 'Скрыть историю заказов';
            ordersHistory.innerHTML = '';
            orders.forEach(order => displayOrder(order, ordersHistory));
        } else {
            ordersHistory.style.display = 'none';
            toggleBtn.textContent = 'Показать историю заказов';
            ordersHistory.innerHTML = '';
            displayOrder(orders[0], ordersHistory); // Показываем снова последний
        }
    });
})
.catch(err => {
    console.error("Ошибка загрузки заказов:", err);
});
})


// Запускаем проверку токена раз в минуту
setInterval(() => {
    if (isTokenExpired()) {
      console.log("⏳ Проверяем обновление токена...");
        console.log("🔄 Токен истёк, обновляем...");
        refreshAccessToken().then(newToken => {
            console.log("✅ Новый токен после автообновления:", newToken);
        }).catch(err => console.error("❌ Ошибка обновления:", err));
    }
}, 60000); // 1 раз в минуту

function editField(field) {
    const input = document.getElementById(field + "Input");
    console.log("Редактируем поле:", field, "Значение:", input.value);

    if (input.disabled) {
        input.disabled = false;
        input.focus();
    } else {
        fetch("https://mobile-site.onrender.com/account", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ [field]: input.value }) // Отправляем данные на сервер
        })
        .then(response => response.json())
        .then(data => {
            console.log("Ответ сервера:", data);
            input.disabled = true;
        })
        .catch(error => console.log("Ошибка обновления профиля:", error));
    }
}
function displayOrder(order, container) {
    const itemsList = order.items.map(item => {
        if (item.productId && item.productId.name) {
            return `<li>${item.productId.name} — ${item.quantity} шт. (${item.price} ₽)</li>`;
        } else {
            return `<li>Товар не найден</li>`;
        }
    }).join('');

    let orderHTML = `
        <div class="order">
            <h3>Заказ №${order._id.slice(0, 8)}</h3>
            <p>Адрес: ${order.address}</p>
            <p>Дата оформления: ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</p>
            <p>Время доставки: ${order.deliveryTime || 'Не указано'}</p>
            <p>Общая сумма: ${order.totalAmount} ₽</p>
    `;

    if (order.additionalInfo) {
        orderHTML += `<p>Дополнительная информация: ${order.additionalInfo}</p>`;
    }

    orderHTML += `<ul>${itemsList}</ul></div><hr>`;

    container.innerHTML += orderHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("https://mobile-site.onrender.com/account", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.name) document.getElementById("nameInput").value = data.name;
        if (data.city) document.getElementById("cityInput").value = data.city;
    })
    .catch(() => console.log("Ошибка загрузки профиля"));
});
document.addEventListener("DOMContentLoaded", () => {
    console.log("Страница загружена");

    const editNameBtn = document.getElementById("editName");
    const editCityBtn = document.getElementById("editCity");

    if (editNameBtn) {
        editNameBtn.addEventListener("click", () => editField("name"));
    } else {
        console.warn("Кнопка editName не найдена!");
    }

    if (editCityBtn) {
        editCityBtn.addEventListener("click", () => editField("city"));
    } else {
        console.warn("Кнопка editCity не найдена!");
    }
});
// Проверка состояния авторизации
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// ✅ Функция для сохранения username в localStorage
function saveUserInfo() {
    const token = localStorage.getItem('token');
    if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.username) {
            localStorage.setItem('username', decoded.username);
        }
    }
}

// ✅ Функция проверки авторизации
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const authButton = document.getElementById('authButton');
    const cabinetButton = document.getElementById('cabinetButton');
    const logoutButton = document.getElementById('Button');

    if (token && username && !isTokenExpired(token)) { // ✅ Проверяем, не истёк ли токен
        authButton.style.display = 'none';
        cabinetButton.style.display = 'inline-block';

        if (window.location.pathname === '/account.html' && logoutButton) {
            logoutButton.style.display = 'inline-block';
        }
    } else {
        authButton.style.display = 'inline-block';
        cabinetButton.style.display = 'none';

        if (logoutButton) {
            logoutButton.style.display = 'none';
        }
    }
}

// ✅ Запускаем проверку при загрузке страницы
document.addEventListener("DOMContentLoaded", checkAuthStatus);

// ✅ Следим за изменениями в localStorage (например, когда токен обновится)
window.addEventListener("storage", checkAuthStatus);

async function logout() {
    const token = localStorage.getItem("token"); // Получаем токен

    // Проверяем, истёк ли токен
    if (isTokenExpired(token)) {
        console.log("Токен истек, пытаемся обновить...");
        // Попробуем обновить токен
        const newToken = await refreshAccessToken();
        if (newToken) {
            // Если новый токен получен, продолжаем выполнение выхода
            await sendLogoutRequest(newToken);
        } else {
            // Если токен не обновился, выводим ошибку и отправляем на страницу входа
            console.error("Не удалось обновить токен. Пройдите повторную авторизацию.");
            window.location.href = "/login.html";  // Перенаправляем на страницу входа
            return;
        }
    } else {
        // Если токен ещё действителен, сразу отправляем запрос на выход
        await sendLogoutRequest(token);
    }
}

async function sendLogoutRequest(token) {
    try {
        const response = await fetch("https://mobile-site.onrender.com/logout", {
            method: "POST",
            credentials: 'include', // Включаем cookies
            headers: {
                "Authorization": `Bearer ${token}`,  // Передаем действующий токен в заголовке
            }
        });

        if (response.ok) {
            // Если запрос успешен, очищаем токены и редиректим
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            window.location.href = "/index.html"; // Перенаправляем на страницу входа
        } else {
            console.error("❌ Ошибка при выходе:", response.status);
        }
    } catch (error) {
        console.error("❌ Ошибка при выходе:", error);
    }
}



// Переход на страницу личного кабинета
function openCabinet() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token || !username) {
        // Если токен отсутствует, перенаправляем на страницу входа
        window.location.href = "/login.html";
    } else {
        // Переход на страницу личного кабинета
        window.location.href = "/account.html";
    }
}

// Инициализация авторизации и кнопок при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
    checkAuthStatus();

    // Убеждаемся, что кнопка "Выход" отображается только в личном кабинете
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton && window.location.pathname !== '/account.html') {
        logoutButton.style.display = 'none';
    }
});

// Расчет баланса на основе корзины
function calculateBalance() {
    let balance = 0;
    for (const item in cart) {
        balance += cart[item].price * cart[item].quantity;
    }
    return balance;
}
// Переход на страницу оформления заказа
function goToCheckoutPage() {
    saveCartToLocalStorage();
    window.location.href = "checkout.html";
}


document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token'); // Получаем токен из localStorage
    if (!token) {
        document.getElementById('usernameDisplay').innerText = "Гость";
        return;
    }
    fetch('/account', {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.username) {
            document.getElementById('usernameDisplay').innerText = data.username;
            document.getElementById('authButton').style.display = 'none'; // Скрываем "Вход"
            document.getElementById('cabinetButton').style.display = 'inline-block'; // Показываем "Личный кабинет"
        } else {
            document.getElementById('usernameDisplay').innerText = "Ошибка загрузки";
        }
    })
    .catch(() => {
        document.getElementById('usernameDisplay').innerText = "Ошибка загрузки";
    });
});
async function updateAccount(newUsername, newPassword) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch("https://mobile-site.onrender.com/account", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // Без этого сервер отклонит запрос
    },
    body: JSON.stringify({ username: newUsername, password: newPassword }),
  });

  const data = await response.json();
  console.log("Ответ от сервера:", data);
}
function handleAuthClick() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'account.html'; // Если пользователь авторизован, переходим в личный кабинет
    } else {
        window.location.href = 'login.html'; // Если нет, перенаправляем на страницу входа
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    const closeMenu = document.querySelector('.close-menu');
    const menuLinks = document.querySelectorAll('.navbar a'); // Все ссылки в меню
    const body = document.body; // Для блокировки прокрутки

    if (!menuToggle || !navbar || !closeMenu) {
        console.error("Не найден один из элементов: menuToggle, navbar, closeMenu.");
        return;
    }

    // Открытие меню
    menuToggle.addEventListener('click', () => {
        navbar.classList.add('active');
        body.classList.add('no-scroll'); // Блокируем прокрутку
    });

    // Закрытие меню
    function closeNavMenu() {
        navbar.classList.remove('active');
        body.classList.remove('no-scroll'); // Разблокируем прокрутку
    }

    closeMenu.addEventListener('click', closeNavMenu);

    // Закрытие меню при клике на любую ссылку
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeNavMenu();
        });
    });
});
document.addEventListener("DOMContentLoaded", function () {
    if (!localStorage.getItem("cookiesAccepted")) {
        showCookieBanner();
    }
});

function showCookieBanner() {
    const banner = document.createElement("div");
    banner.innerHTML = `
        <div id="cookie-banner" style="position: fixed; bottom: 0; width: 100%; background: black; color: white; padding: 10px; text-align: center; z-index: 1000;">
            <p>Мы используем cookies для улучшения работы сайта. Они позволяют оставаться в аккаунте дольше, так как мы передаём данные с помощью них. 
            <button id="acceptCookies" style="margin-left: 10px;">Принять</button></p>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById("acceptCookies").addEventListener("click", function () {
        localStorage.setItem("cookiesAccepted", "true");
        banner.remove();
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const toggleButtons = document.querySelectorAll(".toggle-description-btn");

    toggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Ищем текст внутри родительского элемента
            const parent = button.closest(".menu-item"); // Находим общий контейнер
            const description = parent.querySelector(".description-collapsible"); // Находим текст

            if (description) {
                description.classList.toggle("expanded"); // Переключаем класс "expanded"

                // Меняем текст кнопки
                button.textContent = description.classList.contains("expanded")
                    ? "Свернуть"
                    : "Читать далее";
            } else {
                console.error("Описание не найдено!");
            }
        });
    });
});
async function updateAccount(newUsername, newPassword) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch("https://mobile-site.onrender.com/account", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // Без этого сервер отклонит запрос
    },
    body: JSON.stringify({ username: newUsername, password: newPassword }),
  });

  const data = await response.json();
  console.log("Ответ от сервера:", data);
}

// Переход на страницу оформления заказа
function goToCheckoutPage() {
    saveCartToLocalStorage();
    window.location.href = "checkout.html";
}
