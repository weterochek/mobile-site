let cart = {};

function getToken() {
    return localStorage.getItem("accessToken");
}

document.addEventListener("DOMContentLoaded", () => {
    const cartItemsContainer = document.getElementById("cartItems");
    const totalAmountElement = document.getElementById("totalAmount");
    const checkoutForm = document.getElementById("checkoutForm");
    const backToShoppingButton = document.getElementById("backToShopping");

    // Загружаем корзину из localStorage
    cart = JSON.parse(localStorage.getItem('cart')) || {};

    // Отображаем товары в корзине
    function renderCartItems(items) {
        const cartItemsContainer = document.querySelector('.cart-items');
        cartItemsContainer.innerHTML = '';
        let totalAmount = 0;

        items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="item-info">${item.name}</div>
                <div class="item-price">${item.price} ₽</div>
                <div class="quantity-controls">
                    <button class="quantity-control minus" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-control plus" ${item.quantity >= 100 ? 'disabled' : ''}>+</button>
                </div>
            `;

            const minusButton = cartItem.querySelector('.minus');
            const plusButton = cartItem.querySelector('.plus');

            minusButton.addEventListener('click', () => {
                if (item.quantity > 1) {
                    item.quantity--;
                    updateCart(item.id, item.name, item.price, item.quantity);
                    renderCartItems(getCartItems());
                    updateTotalAmount();
                } else {
                    removeFromCart(item.id);
                    renderCartItems(getCartItems());
                    updateTotalAmount();
                }
            });

            plusButton.addEventListener('click', () => {
                if (item.quantity < 100) {
                    item.quantity++;
                    updateCart(item.id, item.name, item.price, item.quantity);
                    renderCartItems(getCartItems());
                    updateTotalAmount();
                }
            });

            cartItemsContainer.appendChild(cartItem);
            totalAmount += item.price * item.quantity;
        });

        totalAmountElement.textContent = `Итого: ${totalAmount} ₽`;
    }

    // Обработчики для изменения количества товаров
    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.classList.contains('quantity-control')) return;

        const productId = target.dataset.id;
        if (!cart[productId]) return;

        if (target.classList.contains('increase-quantity')) {
            if (cart[productId].quantity < 100) {
                cart[productId].quantity++;
            }
        } else if (target.classList.contains('decrease-quantity')) {
            cart[productId].quantity--;
            if (cart[productId].quantity === 0) {
                delete cart[productId];
            }
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems(Object.values(cart));
    });

    // Загрузка данных пользователя
    async function loadUserData() {
        const token = getToken();
        if (!token) {
            console.log("Пользователь не авторизован");
            return;
        }

        try {
            const response = await fetch("https://mobile-site.onrender.com/account", {
                method: "GET",
                credentials: "include",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 401) {
                // Если токен истек или недействителен, пробуем обновить его
                const refreshResult = await refreshToken();
                if (refreshResult) {
                    // Если обновление успешно, повторяем запрос с новым токеном
                    const newToken = getToken();
                    const newResponse = await fetch("https://mobile-site.onrender.com/account", {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Authorization": `Bearer ${newToken}`,
                            "Content-Type": "application/json"
                        }
                    });
                    if (newResponse.ok) {
                        const userData = await newResponse.json();
                        updateFormWithUserData(userData);
                        return;
                    }
                }
                // Если обновление не удалось, продолжаем без данных пользователя
                console.log("Не удалось обновить токен");
                return;
            }

            if (!response.ok) {
                throw new Error("Ошибка при загрузке данных профиля");
            }

            const userData = await response.json();
            updateFormWithUserData(userData);
        } catch (error) {
            console.error("Ошибка загрузки данных профиля:", error);
        }
    }

    // Функция для обновления токена
    async function refreshToken() {
        try {
            const response = await fetch("https://mobile-site.onrender.com/refresh", {
                method: "POST",
                credentials: "include"
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.accessToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Ошибка при обновлении токена:", error);
            return false;
        }
    }

    // Функция для обновления формы данными пользователя
    function updateFormWithUserData(userData) {
        if (userData.name) {
            document.getElementById("customerName").value = userData.name;
        }
        if (userData.city) {
            document.getElementById("customerAddress").value = userData.city;
        }
    }

    // Оформление заказа
    if (checkoutForm) {
        // Обработчик кнопки "Оформить заказ"
        checkoutForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const token = getToken();
            if (!token) {
                alert("Вы не авторизованы!");
                return;
            }

            // Формируем данные заказа
const orderData = {
    address: document.getElementById("customerAddress").value,
    additionalInfo: document.getElementById("additionalInfo").value,
    deliveryTime: document.getElementById("deliveryTime").value, // добавляем!
    items: Object.keys(cart).map(productId => ({
        productId: productId,
        quantity: cart[productId].quantity
    }))
};
            try {
                const response = await fetch("https://mobile-site.onrender.com/api/order", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    console.error(`Ошибка ${response.status}:`, response.statusText);
                    alert("Ошибка при оформлении заказа.");
                    return;
                }

                const responseData = await response.json();
                alert("🎉 Заказ успешно оформлен!");

                // Очистка корзины после успешного оформления
                cart = {};  // Очищаем корзину
                localStorage.removeItem('cart');  // Удаляем корзину из localStorage
                renderCartItems(Object.values(cart));  // Обновляем отображение корзины
                window.location.href = "account.html";  // Перенаправление на страницу спасибо
            } catch (error) {
                console.error("Ошибка при оформлении заказа:", error);
                alert("Ошибка при оформлении заказа.");
            }
        });
    }

    // Кнопка "Вернуться к покупкам"
    if (backToShoppingButton) {
        backToShoppingButton.addEventListener('click', () => {
            window.location.href = "index.html";
        });
    }

    // Инициализация
    renderCartItems(Object.values(cart));
    loadUserData();
});
