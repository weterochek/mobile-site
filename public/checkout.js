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

// Обработчик для кнопок на странице
document.addEventListener("DOMContentLoaded", () => {
    loadCartFromLocalStorage(); // Загружаем данные корзины
    renderCheckoutCart(); // Отображаем корзину

    // Кнопка "Вернуться к покупкам"
    const backToShoppingButton = document.getElementById("backToShopping");
    if (backToShoppingButton) {
        backToShoppingButton.addEventListener("click", function () {
            saveCartToLocalStorage();
            window.location.href = "index.html"; // Возврат на главную страницу
        });
    }

    // Кнопка "Оформить заказ"
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function (e) {
            e.preventDefault();
            alert("Ваш заказ успешно оформлен!");
            cart = {}; // Очищаем корзину
            saveCartToLocalStorage();
            window.location.href = "index.html"; // Перенаправление на главную
        });
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const additionalInfoField = document.getElementById("additionalInfo");

    // Обработчик для поля "Дополнительная информация"
    additionalInfoField.addEventListener("input", function () {
        // Если пользователь удалил весь текст, возвращаем "(необязательно)"
        if (!this.value.trim()) {
            this.placeholder = "(необязательно)";
        }
    });

    additionalInfoField.addEventListener("focus", function () {
        // Если пользователь начинает писать, убираем placeholder
        if (this.placeholder === "(необязательно)") {
            this.placeholder = "";
        }
    });

    additionalInfoField.addEventListener("blur", function () {
        // Если пользователь уходит с поля и текст пустой, возвращаем placeholder
        if (!this.value.trim()) {
            this.placeholder = "(необязательно)";
        }
    });
});
