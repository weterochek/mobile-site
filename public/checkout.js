let cart = {};

// Загрузка корзины из localStorage
function loadCartFromLocalStorage() {
    const username = localStorage.getItem("username") || "guest"; // Используем имя пользователя или guest
    const storedCart = localStorage.getItem(`cart_${username}`);
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

// Отображение корзины
function renderCheckoutCart() {
    const cartItemsContainer = document.getElementById("cartItems");
    const totalAmountElement = document.getElementById("totalAmount");

    if (!cartItemsContainer || !totalAmountElement) return;

    cartItemsContainer.innerHTML = ""; // Очищаем список
    let totalAmount = 0;

    for (const item in cart) {
        const itemTotal = cart[item].price * cart[item].quantity;
        totalAmount += itemTotal;

        // Генерация HTML для каждого товара
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
            <div class="item-info">
                ${item} - ${cart[item].quantity} шт. - ${itemTotal} ₽
            </div>
            <div class="cart-buttons">
                <button onclick="decrementItem('${item}')">-</button>
                <span class="quantity">${cart[item].quantity}</span>
                <button onclick="incrementItem('${item}', ${cart[item].price})">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    }

    // Итоговая сумма
    totalAmountElement.textContent = `Итого: ${totalAmount} ₽`;
}

// Уменьшение количества товара
function decrementItem(itemName) {
    if (cart[itemName]) {
        cart[itemName].quantity -= 1;
        if (cart[itemName].quantity === 0) {
            delete cart[itemName];
        }
        saveCartToLocalStorage();
        renderCheckoutCart();
    }
}

// Увеличение количества товара
function incrementItem(itemName, itemPrice) {
    if (cart[itemName]) {
        cart[itemName].quantity += 1;
    } else {
        cart[itemName] = { price: itemPrice, quantity: 1 };
    }
    saveCartToLocalStorage();
    renderCheckoutCart();
}

// Сохранение корзины в localStorage
function saveCartToLocalStorage() {
    const username = localStorage.getItem("username") || "guest";
    localStorage.setItem(`cart_${username}`, JSON.stringify(cart));
}

// Загрузка данных пользователя
async function loadUserData() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Вы не авторизованы! Пожалуйста, войдите в аккаунт.");
        window.location.href = "login.html";
        return;
    }
    try {
        const response = await fetch("https://makadamia.onrender.com/account", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error("Ошибка при загрузке данных профиля");
        }
        const userData = await response.json();
        document.getElementById("customerName").value = userData.name || "";
        document.getElementById("customerAddress").value = userData.city || "";
    } catch (error) {
        console.error("Ошибка загрузки данных профиля:", error);
        alert("Не удалось загрузить данные профиля.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadCartFromLocalStorage();
    renderCheckoutCart();
    loadUserData();

    // Кнопка "Вернуться к покупкам"
    const backToShoppingButton = document.getElementById("backToShopping");
    if (backToShoppingButton) {
        backToShoppingButton.addEventListener("click", function () {
            saveCartToLocalStorage();
            window.location.href = "index.html";
        });
    }

    // Кнопка "Оформить заказ"
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Вы не авторизованы!");
                return;
            }
            const orderData = {
                name: document.getElementById("customerName").value,
                address: document.getElementById("customerAddress").value,
                additionalInfo: document.getElementById("additionalInfo").value
            };

            console.log("Отправка данных заказа:", orderData); // Логирование данных перед отправкой

            try {
                const response = await fetch("https://makadamia.onrender.com/order", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(orderData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json(); // Получаем ошибку с сервера
                    console.error("Ошибка при оформлении заказа:", errorData);
                    alert("Ошибка при оформлении заказа: " + (errorData.message || "Неизвестная ошибка"));
                    return;
                }

                alert("Заказ успешно оформлен!");
                cart = {};
                saveCartToLocalStorage();
                window.location.href = "thankyou.html";
            } catch (error) {
                console.error("Ошибка отправки заказа:", error);
                alert("Ошибка при оформлении заказа.");
            }
        });
    }

    const additionalInfoField = document.getElementById("additionalInfo");
    additionalInfoField.addEventListener("input", function () {
        if (!this.value.trim()) {
            this.placeholder = "(необязательно)";
        }
    });
    additionalInfoField.addEventListener("focus", function () {
        if (this.placeholder === "(необязательно)") {
            this.placeholder = "";
        }
    });
    additionalInfoField.addEventListener("blur", function () {
        if (!this.value.trim()) {
            this.placeholder = "(необязательно)";
        }
    });
});
