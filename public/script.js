// Глобальные переменные
let productMap = {};// Будет заполнен динамически
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let currentPage = 1;
let reviewsPerPage = 5;
let allReviews = [];
let isSubmittingReview = false; // Добавляем флаг отправки отзыва

(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const currentURL = window.location.href;

    console.log("User-Agent:", userAgent);
    console.log("Текущий URL:", currentURL);
    console.log("sessionStorage.redirected:", sessionStorage.getItem("redirected"));

    if (sessionStorage.getItem("redirected")) {
        console.log("Редирект уже выполнялся, прерываем.");
        return;
    }

    if (userAgent.includes("mobile") && !currentURL.includes("mobile-site.onrender.com")) {
        console.log("🟢 Должен быть редирект на мобильную версию...");
        sessionStorage.setItem("redirected", "true");
        window.location.href = "https://mobile-site.onrender.com";
    } else if (!userAgent.includes("mobile") && !currentURL.includes("makadamia.onrender.com")) {
        console.log("🟢 Должен быть редирект на десктопную версию...");
        sessionStorage.setItem("redirected", "true");
        window.location.href = "https://makadamia.onrender.com";
    } else {
        console.log("🔴 Условие редиректа не выполнено.");
    }
})();

(async () => {
    console.log("🔄 Мгновенная проверка и обновление токена...");

    const token = localStorage.getItem("accessToken");

    if (!token) {
        console.log("⏳ Access-токен отсутствует, обновляем немедленно...");
        await refreshAccessToken();
    } else if (isTokenExpired(token)) {
        console.log("⚠️ Access-токен истёк, обновляем...");
        await refreshAccessToken();
    } else {
        console.log("✅ Access-токен активен, обновление не требуется.");
    }
})();
document.addEventListener("DOMContentLoaded", function () {
    console.log("JS загружен!");

    const buttons = document.querySelectorAll(".accordion-button");

    buttons.forEach((button, index) => {
        button.addEventListener("click", function () {
            console.log(`Клик по кнопке: ${index}`);

            const content = this.nextElementSibling;

            if (content && content.classList.contains("accordion-content")) {
                const isOpen = content.classList.contains("open");
                console.log(`Открыт ли контент ${index}?`, isOpen);

                if (isOpen) {
                    // Закрываем текущий контент
                    content.classList.remove("open");
                    content.style.maxHeight = null;
                    console.log(`Закрываю контент ${index}`);
                } else {
                    // Закрываем все перед открытием нового
                    document.querySelectorAll(".accordion-content").forEach((el) => {
                        el.classList.remove("open");
                        el.style.maxHeight = null;
                    });

                    // Открываем нужный блок
                    content.classList.add("open");
                    content.style.maxHeight = content.scrollHeight + "px";
                    console.log(`Открываю контент ${index}, высота: ${content.scrollHeight}px`);
                }
            } else {
                console.log("Контент не найден!");
            }
        });
    });
});



document.addEventListener("DOMContentLoaded", async () => {
    console.log("🔄 Дополнительная проверка токена после загрузки DOM...");

    const token = localStorage.getItem("accessToken");
    if (!token || isTokenExpired(token)) {
        console.log("⏳ Повторная попытка обновления токена...");
        await refreshAccessToken();
    }
});

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


console.log("Отправка запроса на /refresh");
console.log("Токен перед запросом:", localStorage.getItem("accessToken"));
window.onload = function () {
    // Вызов updateControls для всех товаров в корзине
    for (const productId in cart) {
        updateControls(productId);
    }
    updateCartDisplay();
};
document.addEventListener("DOMContentLoaded", function () {
    const cartItems = document.getElementById("cartItems");
    const cartDropdown = document.getElementById("cartDropdown");

    if (cartDropdown) {
        cartDropdown.style.display = "none"; // Убираем корзину по умолчанию
        cartDropdown.style.flexDirection = "column";
    }
    
    const cartFooter = document.createElement("div");
    cartFooter.id = "cartFooter";
    cartFooter.style.position = "sticky";
    cartFooter.style.bottom = "0";
    cartFooter.style.background = "white";
    cartFooter.style.padding = "10px";
    cartFooter.style.boxShadow = "0 -2px 5px rgba(0, 0, 0, 0.1)";
    cartFooter.style.display = "flex";
    cartFooter.style.justifyContent = "space-between";
    cartFooter.style.alignItems = "center";
    
    const checkoutButton = document.querySelector("button[onclick='goToCheckoutPage()']");
    const clearCartButton = document.getElementById("clear-cart");
    
    if (checkoutButton && clearCartButton) {
        cartFooter.appendChild(checkoutButton);
        cartFooter.appendChild(clearCartButton);
        cartDropdown.appendChild(cartFooter);
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const cartButton = document.getElementById("cartButton");
    const cartDropdown = document.getElementById("cartDropdown");

    if (cartButton && cartDropdown) {
        cartButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            cartDropdown.classList.toggle("active");
            cartDropdown.style.display = cartDropdown.classList.contains("active") ? "block" : "none";
        });

        // Закрытие корзины при клике на крестик
        const closeCartButton = document.createElement("span");
        closeCartButton.innerHTML = "✖";
        closeCartButton.style.cursor = "pointer";
        closeCartButton.style.position = "absolute";
        closeCartButton.style.top = "15px";
        closeCartButton.style.right = "15px";
        closeCartButton.style.fontSize = "24px";
        closeCartButton.style.color = "#333";
        closeCartButton.style.zIndex = "1002";
        closeCartButton.addEventListener("click", function (event) {
            event.stopPropagation();
            cartDropdown.classList.remove("active");
            setTimeout(() => {
                cartDropdown.style.display = "none";
            }, 300);
        });

        cartDropdown.prepend(closeCartButton);

        // Предотвращение закрытия при клике внутри корзины
        cartDropdown.addEventListener("click", function(event) {
            event.stopPropagation();
        });
    }
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


document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("cookiesAccepted") === "true") {
        const token = localStorage.getItem("accessToken"); // Получаем токен

        if (!token) {
            console.warn("❌ Нет токена, не запрашиваем /account");
            return;
        }

        fetch("https://mobile-site.onrender.com/account", {
            method: "GET",
            credentials: "include", // ✅ Передаем cookies
            headers: {
                "Authorization": `Bearer ${token}` // ✅ Передаем токен
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => console.log("✅ Данные аккаунта:", data))
        .catch(error => console.error("❌ Ошибка загрузки аккаунта:", error));
    } else {
        console.log("⚠️ Пользователь не принял cookies. Запрос не отправлен.");
    }
});
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateControls(productId) {
    const addButton = document.getElementById(`addButton_${productId}`);
    const removeButton = document.getElementById(`removeBtn_${productId}`);
    const quantityDisplay = document.getElementById(`quantity_${productId}`);
    const addButtonControl = document.getElementById(`addBtn_${productId}`);

    if (cart[productId] && cart[productId].quantity > 0) {
        if (addButton) addButton.style.display = "none";
        if (removeButton) removeButton.style.display = "inline-block";
        if (addButtonControl) {
            addButtonControl.style.display = "inline-block";
            // Делаем кнопку + неактивной, если достигнут лимит
            addButtonControl.disabled = cart[productId].quantity >= 100;
        }
        if (quantityDisplay) {
            quantityDisplay.style.display = "inline-block";
            quantityDisplay.textContent = cart[productId].quantity;
        }
    } else {
        if (addButton) addButton.style.display = "inline-block";
        if (removeButton) removeButton.style.display = "none";
        if (addButtonControl) addButtonControl.style.display = "none";
        if (quantityDisplay) {
            quantityDisplay.style.display = "none";
        }
    }
}
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



function updateAddToCartButton(productId) {
    const addToCartButton = document.querySelector(`.add-to-cart-button[data-id="${productId}"]`);
    if (addToCartButton) {
        addToCartButton.textContent = "В корзине";
        addToCartButton.disabled = true;
    }
}
async function handleCheckoutFormSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem("accessToken");

    if (!token) {
        alert("Вы не авторизованы!");
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const items = Object.keys(cart).map(productId => ({
        productId: productId,
        quantity: cart[productId].quantity
    }));

    const nameInput = document.getElementById('customerName');
    const addressInput = document.getElementById('customerAddress');
    const additionalInfoInput = document.getElementById('additionalInfo');
    const userId = localStorage.getItem("userId");

    const orderData = {
        userId: userId,
        name: nameInput.value,
        address: addressInput.value,
        additionalInfo: additionalInfoInput.value,
        items: items
    };

    console.log("📡 Отправка данных заказа:", orderData);

    try {
        const response = await fetch("https://mobile-site.onrender.com/api/order", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        });

        console.log("📥 Ответ от сервера:", response);

        if (!response.ok) {
            console.error(`❌ Ошибка ${response.status}:`, response.statusText);
            alert("Ошибка при оформлении заказа.");
            return;
        }

        const responseData = await response.json();
        console.log("✅ Заказ успешно оформлен:", responseData);

        alert("🎉 Заказ успешно оформлен!");
        saveCart();
        window.location.href = "index.html";
    } catch (error) {
        console.error("❌ Ошибка сети или сервера:", error);
        alert("Ошибка при оформлении заказа. Проверьте соединение.");
    }
}
document.addEventListener("DOMContentLoaded", () => {
    renderCheckoutCart();
    loadUserData();
    initializeAddToCartButtons();

    const backToShoppingButton = document.getElementById("backToShopping");
    if (backToShoppingButton) {
        backToShoppingButton.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }

    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", handleCheckoutFormSubmit);
    }
});
function initializeAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll(".add-to-cart-button");
    addToCartButtons.forEach(button => {
        const productId = button.getAttribute("data-id");
        const productName = button.getAttribute("data-name");
        const productPrice = parseFloat(button.getAttribute("data-price"));

        button.addEventListener("click", () => {
            addToCart(productId, productName, productPrice);
        });

        // Проверяем, есть ли товар в корзине, чтобы обновить состояние кнопки
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        if (cart[productId]) {
            updateAddToCartButton(productId);
        }
    });
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


// Добавление товара
function addToCart(productId, productName, productPrice) {
    if (!cart[productId]) {
        cart[productId] = {
            name: productName,
            price: productPrice,
            quantity: 1
        };
    } else {
        cart[productId].quantity++;
    }

    localStorage.setItem('cart', JSON.stringify(cart));  // Сохраняем корзину
    updateControls(productId);  // Обновляем кнопки и количество
    updateCartDisplay();  // Обновляем отображение корзины
}



function updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    cartItems.innerHTML = ""; 
    let totalAmount = 0;

    for (const productId in cart) {
        const item = cart[productId]; // item = { name, price, quantity }
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.setAttribute("data-id", productId); // Назовём честно productId
        cartItem.innerHTML = `
            <div class="item-info">${item.name} - ${itemTotal} ₽</div>  <!-- Используем item.name для отображения названия товара -->
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


function updateQuantityDisplay(productName) {
    const quantityElement = document.getElementById(`quantity_${productName}`);
    if (quantityElement) {
        quantityElement.textContent = cart[productName].quantity;
    }
}
function checkForEmptyCart(productName) {
    const quantity = cart[productName] ? cart[productName].quantity : 0;
    const addButton = document.getElementById(`addButton_${productName}`);
    const controls = document.getElementById(`controls_${productName}`);

    // Если количество товара равно нулю, показываем кнопку "Добавить"
    if (quantity === 0) {
        if (addButton) addButton.style.display = 'inline-block';  // Показываем кнопку "Добавить"
        if (controls) controls.style.display = 'none';  // Скрываем кнопки "+" и "-"
    }
}


// Увеличение количества товара
function incrementItem(productId, price) {
    if (cart[productId]) {
        // Проверяем, не превышен ли лимит в 100 единиц
        if (cart[productId].quantity >= 100) {
            alert('Достигнут максимальный лимит товара (100 шт.)');
            return;
        }
        cart[productId].quantity += 1;
        saveCart();
        updateControls(productId);
        updateCartDisplay();
    }
}

function decrementItem(productId) {
    if (cart[productId]) {
        cart[productId].quantity -= 1;
        if (cart[productId].quantity <= 0) {
            delete cart[productId]; // Удаляем товар из корзины
        }
        saveCart();
        updateControls(productId); // Обновляем кнопки
        updateCartDisplay(); // Обновляем корзину
    }
}


function updateQuantityDisplay(productName) {
    const quantityElement = document.getElementById(`quantity_${productName}`);
    if (quantityElement) {
        quantityElement.textContent = cart[productName].quantity;
    }
}
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}


//ощичение корзины
document.addEventListener('DOMContentLoaded', () => {
    const clearCartButton = document.getElementById('clear-cart');
    const cartTotal = document.getElementById('totalAmount');

    if (clearCartButton) {
        clearCartButton.addEventListener('click', () => {
            cart = {};  // Очищаем корзину
            localStorage.removeItem('cart'); // Удаляем корзину
            updateCartDisplay();  // Обновляем отображение корзины
            if (cartTotal) {
                cartTotal.textContent = 'Итого: 0 ₽';
            }

            const productCards = document.querySelectorAll(".card-dish");
            productCards.forEach(card => {
                const addButton = card.querySelector(".add-button-size");
                const removeButton = card.querySelector(".quantity-control");
                const addButtonControl = card.querySelector(".quantity-size-button");
                const quantityDisplay = card.querySelector(".quantity-display");

                // Скрываем кнопки и количество
                if (addButton) addButton.style.display = "inline-block";
                if (removeButton) removeButton.style.display = "none";
                if (addButtonControl) addButtonControl.style.display = "none";
                if (quantityDisplay) {
                    quantityDisplay.textContent = "";
                    quantityDisplay.style.display = "none";
                }
            });
        });
    }
});

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
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
        console.log("Пользователь не авторизован");
        return;
    }

    fetch(`https://mobile-site.onrender.com/api/user-orders`, { 
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


// Обновление отображения корзины после очистки
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

// Сохранение корзины в localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}
function renderCheckoutCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalPrice = document.getElementById("cartTotalPrice");

    cartItemsContainer.innerHTML = "";
    let totalPrice = 0;

    for (const productId in cart) {
        const item = cart[productId];
        const itemTotalPrice = item.price * item.quantity;
        totalPrice += itemTotalPrice;

        const cartItemElement = document.createElement("div");
        cartItemElement.className = "cart-item";
        cartItemElement.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-quantity">${item.quantity} шт.</span>
            <span class="item-price">${itemTotalPrice.toFixed(2)} ₽</span>
        `;
        cartItemsContainer.appendChild(cartItemElement);
    }

    cartTotalPrice.textContent = totalPrice.toFixed(2) + " ₽";
}
function updateTotal() {
    const cartItems = getCartItems();
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = document.getElementById('totalAmount');
    if (totalAmount) {
        totalAmount.textContent = `Итого: ${total} ₽`;
    }
}
function getCartItems() {
    const stored = localStorage.getItem('cartItems');
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
}
// Оформление заказа
function checkout() {
    alert("Ваш заказ оформлен!");
    cart = {};
    updateCartDisplay();
    resetAddToCartButtons();
    saveCart();
    toggleCart();
}

// Сброс всех кнопок на исходное состояние "Добавить"
function resetAddToCartButtons() {
    for (const itemName in cart) {
        revertControlsToAddButton(itemName);
    }
}

// Загрузка корзины из localStorage при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    loadCartFromLocalStorage();
    const cartModal = document.getElementById("cartModal");
    if (cartModal) cartModal.style.display = "none";
});

// Функция загрузки корзины
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("accessToken");

    if (!token) {
        console.warn("❌ Нет accessToken, пробуем обновить...");
        token = await refreshAccessToken();
        if (!token) return null;
    }

    const res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`  // Добавляем токен в заголовки
        }
    });

    if (res.status === 401) {
        console.warn("🔄 Токен истёк, пробуем обновить...");
        token = await refreshAccessToken();
        if (!token) return res;

        return fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
        });
    }

    return res;
}
document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');  // Получаем токен из localStorage

    if (accessToken) {
        document.getElementById('authButton').textContent = 'Личный кабинет';  // Изменяем кнопку
        await loadUserData(accessToken);  // Загружаем данные пользователя
    } else {
        document.getElementById('authButton').textContent = 'Вход';  // Если токен отсутствует, отображаем "Вход"
    }
});


function getTokenExp(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp;
    } catch (e) {
        return null;
    }
}


async function refreshAccessToken() {
    console.log("🔄 Запрос на обновление access-токена...");

    try {
        const response = await fetch("https://mobile-site.onrender.com/refresh", {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) {
            const data = await response.json();
            console.warn("❌ Ошибка обновления токена:", data.message);

            if (data.message.includes("Refresh-токен истек") || data.message.includes("Недействителен")) {
                console.error("⏳ Refresh-токен окончательно истек. Требуется повторный вход!");
                logout();
            }
            
            return null;
        }

        const data = await response.json();
        console.log("✅ Новый accessToken:", data.accessToken);

        if (data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
        } else {
            console.error("❌ Сервер не отправил новый accessToken!");
            return null;
        }

        return data.accessToken;
    } catch (error) {
        console.error("❌ Ошибка при обновлении токена:", error);
        return null;
    }
}



function generateTokens(user, site) {
    const issuedAt = Math.floor(Date.now() / 1000);
    
    const accessToken = jwt.sign(
        { id: user._id, username: user.username, iat: issuedAt },
        JWT_SECRET,
        { expiresIn: "30m" }  // ⏳ Access-токен на 30 минут
    );

    const refreshToken = jwt.sign(
        { id: user._id, username: user.username, site, iat: issuedAt },
        REFRESH_SECRET,
        { expiresIn: "7d" }  // 🔄 Refresh-токен на 7 дней
    );

    return { accessToken, refreshToken };
}


function isTokenExpired(token) {
    if (!token) return true; // Если токена нет, он считается истекшим

    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); // Исправляем base64
        const payload = JSON.parse(atob(base64)); // Декодируем payload
        return (Date.now() / 1000) >= payload.exp; // Проверяем срок действия
    } catch (e) {
        console.error("❌ Ошибка декодирования токена:", e);
        return true;
    }
}



// Запускаем проверку токена раз в минуту
setInterval(async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        console.warn("⚠️ Нет accessToken, пробуем обновить...");
        await refreshAccessToken();
        return;
    }

    const exp = getTokenExp(token);
    const now = Math.floor(Date.now() / 1000);

    if (!exp || (exp - now) < 300) { // Если токен просрочен или скоро истечёт
        console.log("⏳ Access-токен истекает, обновляем...");
        await refreshAccessToken();
    }
}, 30000); // Проверяем каждые 30 секунд



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
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`
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

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        console.warn("❌ Нет токена, не запрашиваем /account");
        return;
    }

    fetch("https://mobile-site.onrender.com/account", {
        method: "GET", // ✅ Добавляем явное указание метода
        headers: { 
            "Authorization": `Bearer ${token}` // ✅ Передаем токен
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Ошибка HTTP: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        const nameInput = document.getElementById("nameInput");
        const cityInput = document.getElementById("cityInput");

        if (nameInput) nameInput.value = data.name || "";
        if (cityInput) cityInput.value = data.city || "";
    })
    .catch(error => console.error("❌ Ошибка загрузки профиля:", error));
});
async function updateAccountField(data) {
    const token = localStorage.getItem("accessToken");

    try {
        const response = await fetch("https://mobile-site.onrender.com/account", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Без этого сервер отклонит запрос
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("Ошибка при обновлении данных");
        }

        const result = await response.json();
        console.log("✅ Данные успешно обновлены:", result);
    } catch (error) {
        console.error("❌ Ошибка обновления данных:", error);
    }
}


document.getElementById('editName').addEventListener('click', () => {
    document.getElementById('nameInput').disabled = false;
    document.getElementById('saveName').style.display = 'inline-block';
});

document.getElementById('saveName').addEventListener('click', async () => {
    const newName = document.getElementById('nameInput').value;
    await updateAccountField({ name: newName });
    document.getElementById('nameInput').disabled = true;
    document.getElementById('saveName').style.display = 'none';
});

// Аккаунт: редактировать город
document.getElementById('editCity').addEventListener('click', () => {
    document.getElementById('cityInput').disabled = false;
    document.getElementById('saveCity').style.display = 'inline-block';
});

document.getElementById('saveCity').addEventListener('click', async () => {
    const newCity = document.getElementById('cityInput').value;
    await updateAccountField({ city: newCity });
    document.getElementById('cityInput').disabled = true;
    document.getElementById('saveCity').style.display = 'none';
});
// Проверка состояния авторизации
function checkAuthStatus() {
    const token = localStorage.getItem("accessToken"); // Должно быть accessToken
    const username = localStorage.getItem("username");
    const authButton = document.getElementById("authButton");
    const cabinetButton = document.getElementById("cabinetButton");

    if (!authButton || !cabinetButton) {
        console.warn("❌ Не найдены кнопки 'Вход' или 'Личный кабинет'!");
        return;
    }

    if (token && username && !isTokenExpired(token)) { 
        console.log("✅ Пользователь авторизован");
        authButton.style.display = "none";
        cabinetButton.style.display = "inline-block";
    } else {
        console.log("⚠️ Пользователь не авторизован");
        authButton.style.display = "inline-block";
        cabinetButton.style.display = "none";
        sessionStorage.removeItem("authChecked");
    }
}

async function logout() {
    console.log("🚪 Выход из аккаунта...");

    try {
        await fetch("https://mobile-site.onrender.com/logout", {
            method: "POST",
            credentials: "include" // Передаем cookies
        });

        // Очищаем локальное хранилище
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");

        console.log("✅ Выход выполнен успешно!");
    } catch (error) {
        console.error("❌ Ошибка при выходе:", error);
    } finally {
        // Перенаправляем пользователя на страницу входа
        window.location.href = "/index.html";
    }
}



function handleAuthClick() {
    const token = localStorage.getItem('accessToken');
    if (token) {
        window.location.href = 'account.html';
    } else {
        window.location.href = 'login.html';
    }
}

// Переход на страницу личного кабинета
function openCabinet() {
    const token = localStorage.getItem('accessToken');
    const username = localStorage.getItem('username');

   if (!token && !sessionStorage.getItem("authFailed")) {
    alert("Вы не авторизованы. Перенаправление...");
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
    saveCart();
    window.location.href = "checkout.html";
}


document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('accessToken'); // Получаем токен из localStorage
    if (!token) {
        document.getElementById('usernameDisplay').innerText = "Гость";
        return;
    }

    fetch("https://mobile-site.onrender.com/account", {
        method: "GET",
        credentials: "include", // ✅ Добавляем передачу cookies
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Ошибка HTTP: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        if (data.username) {
            document.getElementById('usernameDisplay').innerText = data.username;
            document.getElementById('authButton').style.display = 'none'; // Скрываем "Вход"
            document.getElementById('cabinetButton').style.display = 'inline-block'; // Показываем "Личный кабинет"
        } else {
            document.getElementById('usernameDisplay').innerText = "Ошибка загрузки";
        }
    })
    .catch(error => {
        console.error("Ошибка загрузки аккаунта:", error);
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
function toggleContent(id) {
    const content = document.getElementById(id);
    content.classList.toggle('active');
}
function loadUserData() {
    const customerNameInput = document.getElementById("customerName");
    const customerAddressInput = document.getElementById("customerAddress");
    const additionalInfoInput = document.getElementById("additionalInfo");

    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    if (customerNameInput) customerNameInput.value = userData.name || "";
    if (customerAddressInput) customerAddressInput.value = userData.address || "";
    if (additionalInfoInput) additionalInfoInput.value = userData.additionalInfo || "";
}


// Убедитесь, что этот код в `script.js` загружен перед его вызовом в HTML
document.addEventListener("DOMContentLoaded", function () {
    const authButton = document.getElementById("authButton");
    if (authButton) {
        authButton.onclick = handleAuthClick;
    }
});
async function loadOrders() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("Вы не авторизованы!");
        return;
    }

    try {
        const response = await fetch("https://mobile-site.onrender.com/orders", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Ошибка при загрузке заказов");
        }

        const orders = await response.json();
        displayOrders(orders); // Вызываем функцию для отображения заказов

    } catch (error) {
        console.error("Ошибка при загрузке заказов:", error);
        alert("Ошибка при загрузке заказов");
    }
}
document.addEventListener("DOMContentLoaded", function () {
    console.log("JS загружен!"); // Проверка загрузки скрипта

    const buttons = document.querySelectorAll(".accordion-button");

    buttons.forEach((button, index) => {
        button.addEventListener("click", function () {
            console.log(`Клик по кнопке: ${index}`); // Проверка кликов

            const content = this.nextElementSibling;

            if (content && content.classList.contains("accordion-content")) {
                console.log("Найден контент:", content);

                if (content.style.maxHeight) {
                    // Закрываем
                    content.style.maxHeight = null;
                    this.classList.remove("active");
                    console.log(`Контент ${index} закрыт`);
                } else {
                    // Закрываем все остальные
                    document.querySelectorAll(".accordion-content").forEach((el) => {
                        el.style.maxHeight = null;
                        el.previousElementSibling.classList.remove("active");
                    });

                    // Открываем нужный блок
                    content.style.maxHeight = content.scrollHeight + "px";
                    this.classList.add("active");
                    console.log(`Контент ${index} открыт, высота: ${content.scrollHeight}px`);
                }
            } else {
                console.log("Контент не найден!");
            }
        });
    });
});

// Функции для работы с отзывами
// Удаляем старую версию функции displayReviews и оставляем только новую версию выше

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация корзины
    const cartButton = document.getElementById('cartButton');
    if (cartButton) {
        cartButton.addEventListener('click', toggleCart);
    }

    // Инициализация отзывов
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Проверяем, не отправляется ли уже отзыв
            if (isSubmittingReview) {
                console.log("Отзыв уже отправляется...");
                return;
            }

            // Получаем кнопку отправки
            const submitButton = document.getElementById('submitReview');
            
            try {
                // Устанавливаем флаг отправки и блокируем кнопку
                isSubmittingReview = true;
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Отправляем...";
                }

                // Получаем данные формы
                const formData = new FormData(reviewForm);
                const reviewData = {
                    rating: formData.get('rating'),
                    comment: formData.get('comment'),
                    displayName: formData.get('displayName') || ''
                };

                // Проверяем авторизацию
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    throw new Error("Вы не авторизованы!");
                }

                // Отправляем отзыв
                const response = await fetch('https://mobile-site.onrender.com/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(reviewData)
                });

                if (!response.ok) {
                    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
                }

                // Получаем ответ
                const result = await response.json();
                
                // Очищаем форму
                reviewForm.reset();
                
                // Обновляем список отзывов
                await loadReviews();
                
                alert("Спасибо! Ваш отзыв успешно отправлен.");

            } catch (error) {
                console.error("Ошибка при отправке отзыва:", error);
                alert(error.message || "Ошибка при отправке отзыва. Попробуйте позже.");
            } finally {
                // Сбрасываем флаг отправки и разблокируем кнопку
                isSubmittingReview = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Отправить";
                }
            }
        });
    }

    // Загрузка отзывов
    const reviewContainer = document.getElementById('reviewContainer');
    if (reviewContainer) {
        loadReviews();
    }

    // Обновление корзины
    updateCart();
});

// Функция загрузки отзывов с пагинацией
async function loadReviews() {
    try {
        console.log('Начинаем загрузку отзывов...');
        const response = await fetch('https://mobile-site.onrender.com/api/reviews');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Получены данные от сервера:', data);

        // Инициализируем массив отзывов
        if (Array.isArray(data)) {
            console.log('Данные уже являются массивом');
            allReviews = [...data];
        } else if (data && typeof data === 'object') {
            console.log('Данные являются объектом, проверяем структуру');
            if (data.reviews && Array.isArray(data.reviews)) {
                allReviews = [...data.reviews];
            } else if (Object.keys(data).length > 0) {
                allReviews = Object.values(data);
            }
        }

        // Проверяем, что получили массив
        if (!Array.isArray(allReviews)) {
            console.error('Не удалось получить массив отзывов');
            allReviews = [];
        }

        // Фильтруем невалидные отзывы
        allReviews = allReviews.filter(review => review && typeof review === 'object');

        console.log('Обработанные отзывы:', allReviews);
        
        const reviewContainer = document.getElementById('reviewContainer');
        if (!reviewContainer) {
            console.error('Контейнер отзывов не найден');
            return;
        }

        if (allReviews.length === 0) {
            reviewContainer.innerHTML = '<div class="no-reviews">Пока нет отзывов. Будьте первым!</div>';
            return;
        }

        // Сбрасываем текущую страницу на первую
        currentPage = 1;
        
        // Обновляем пагинацию и отображаем первую страницу
        updatePagination();
        displayReviews(1); // Явно передаем номер страницы
        
    } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
        const reviewContainer = document.getElementById('reviewContainer');
        if (reviewContainer) {
            reviewContainer.innerHTML = '<div class="error-message">Произошла ошибка при загрузке отзывов. Пожалуйста, попробуйте позже.</div>';
        }
    }
}

// Функция обновления пагинации
function updatePagination() {
    console.log('Обновление пагинации...');
    
    // Проверяем наличие и валидность массива отзывов
    if (!allReviews || !Array.isArray(allReviews)) {
        console.error('Массив отзывов отсутствует или невалиден');
        return;
    }
    
    const totalPages = Math.ceil(allReviews.length / reviewsPerPage);
    console.log('Всего страниц:', totalPages);
    
    const pagination = document.querySelector('.review-pagination');
    if (!pagination) {
        console.error('Контейнер пагинации не найден');
        return;
    }
    
    // Очищаем существующие кнопки страниц
    const pageButtons = pagination.querySelectorAll('.page-btn:not([aria-label])');
    pageButtons.forEach(btn => btn.remove());
    
    const prevButton = pagination.querySelector('[aria-label="Previous"]');
    const nextButton = pagination.querySelector('[aria-label="Next"]');
    
    if (!prevButton || !nextButton) {
        console.error('Кнопки навигации не найдены');
        return;
    }
    
    // Определяем диапазон отображаемых страниц
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Корректируем startPage, если endPage уперся в максимум
    if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Если startPage стал 1, корректируем endPage
    if (startPage === 1) {
        endPage = Math.min(totalPages, 5);
    }
    
    console.log('Диапазон страниц:', { startPage, endPage, currentPage });
    
    // Добавляем кнопки для каждой страницы в диапазоне
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn${currentPage === i ? ' active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayReviews(currentPage);
            updatePagination();
        });
        
        pagination.insertBefore(pageBtn, nextButton);
    }
    
    // Обновляем состояние кнопок "Предыдущая" и "Следующая"
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    // Добавляем обработчики для кнопок "Предыдущая" и "Следующая"
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayReviews(currentPage);
            updatePagination();
        }
    };

    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayReviews(currentPage);
            updatePagination();
        }
    };
    
    console.log('Пагинация обновлена');
}

// Функция отображения отзывов для текущей страницы
function displayReviews(page) {
    console.log('Отображение отзывов для страницы:', page);
    
    const reviewContainer = document.getElementById('reviewContainer');
    if (!reviewContainer) {
        console.error('Контейнер отзывов не найден');
        return;
    }

    // Проверяем наличие массива отзывов
    if (!allReviews || !Array.isArray(allReviews)) {
        console.error('Отзывы не являются массивом:', allReviews);
        reviewContainer.innerHTML = '<div class="error-message">Ошибка отображения отзывов</div>';
        return;
    }

    const startIndex = (page - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const pageReviews = allReviews.slice(startIndex, endIndex);
    
    console.log('Отзывы для текущей страницы:', pageReviews);
    
    reviewContainer.innerHTML = '';
    
    if (pageReviews.length === 0) {
        reviewContainer.innerHTML = '<div class="no-reviews">На этой странице нет отзывов.</div>';
        return;
    }

    try {
        for (let i = 0; i < pageReviews.length; i++) {
            const review = pageReviews[i];
            if (!review) {
                console.warn('Пропущен пустой отзыв');
                continue;
            }
            
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            
            // Безопасное получение данных
            const rating = review && review.rating ? parseInt(review.rating) : 0;
            const stars = '★'.repeat(Math.min(5, Math.max(0, rating))) + '☆'.repeat(5 - Math.min(5, Math.max(0, rating)));
            const date = review && review.date ? new Date(review.date).toLocaleDateString('ru-RU') : 'Дата не указана';
            
            // Новая логика отображения имени
            let displayName;
            if (review.displayName && review.username) {
                // Если указано и имя, и ник - показываем оба
                displayName = `${review.displayName}(${review.username})`;
            } else if (review.username) {
                // Если указан только ник - показываем его
                displayName = review.username;
            } else {
                // Если ничего не указано
                displayName = 'Анонимный пользователь';
            }
            
            const comment = review && review.comment ? review.comment : '';
            
            reviewElement.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${displayName}</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="review-rating">${stars}</div>
                <div class="review-text">${comment}</div>
            `;
            
            reviewContainer.appendChild(reviewElement);
        }
        console.log('Отзывы успешно отображены');
    } catch (error) {
        console.error('Ошибка при отображении отзывов:', error);
        reviewContainer.innerHTML = '<div class="error-message">Произошла ошибка при отображении отзывов.</div>';
    }
}

// Функция для переключения видимости корзины
function toggleCart() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (cartDropdown) {
        if (cartDropdown.classList.contains('active')) {
            cartDropdown.classList.remove('active');
        } else {
            cartDropdown.classList.add('active');
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Закрытие корзины при клике вне её
    document.addEventListener('click', function(event) {
        const cartDropdown = document.getElementById('cartDropdown');
        const cartButton = document.getElementById('cartButton');
        
        if (cartDropdown && cartButton) {
            // Проверяем, был ли клик на кнопках управления количеством
            const isQuantityControl = event.target.closest('.cart-buttons');
            
            // Закрываем корзину только если клик был вне корзины, вне кнопки корзины и не на элементах управления количеством
            if (!cartDropdown.contains(event.target) && 
                !cartButton.contains(event.target) && 
                !isQuantityControl) {
                cartDropdown.classList.remove('active');
            }
        }
    });

    // Предотвращение закрытия при клике внутри корзины
    const cartDropdown = document.getElementById('cartDropdown');
    if (cartDropdown) {
        cartDropdown.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
});
