require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Joi = require("joi");
const app = express();

// Настройка CORS
const allowedOrigins = [
  'https://makadamia.onrender.com',
  'http://localhost:3000', // Для локальной разработки
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Используем CORS с настройками
app.use(cors(corsOptions));
app.use(cookieParser());

// Подключение к MongoDB
const JWT_SECRET = process.env.JWT_SECRET || "ai3ohPh3Aiy9eeThoh8caaM9voh5Aezaenai0Fae2Pahsh2Iexu7Qu/";
const mongoURI = process.env.MONGO_URI || "mongodb://11_ifelephant:ee590bdf579c7404d12fd8cf0990314242d56e62@axs-h.h.filess.io:27018/11_ifelephant";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "J8$GzP1d&KxT^m4YvNcR";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: false, // Включено SSL
})
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware для обработки JSON
app.use(express.json());
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.warn("Ошибка 401: Токен отсутствует в заголовках");
        return res.status(401).json({ message: "Токен не предоставлен" });
    }

    try {
        console.log("Проверяем токен:", token); // Лог для отладки
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.warn("Ошибка 401: Недействительный токен", err.message);
        return res.status(401).json({ message: "Недействительный токен" });
    }
};
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem("token");

    if (!token) {
        console.warn("Нет токена, перенаправляем на вход.");
        logout();
        return;
    }

    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status === 401) {
        console.warn("Ошибка 401: Токен истёк, пробуем обновить.");
        token = await refreshAccessToken();
        if (!token) return response;

        response = await fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
        });
    }

    return response;
}
// Перенаправление HTTP на HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
const Cart = require("./models/Cart"); // Подключаем модель

app.post('/cart/add', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Авторизуйтесь, чтобы добавить товар в корзину' });
    }

    const { productId, quantity } = req.body;
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.status(200).json({ message: "Товар добавлен в корзину", cart });

  } catch (error) {
    console.error("Ошибка добавления в корзину:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Указание папки со статическими файлами
app.use(express.static(path.join(__dirname, "public")));

// Схема и модель пользователя
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: "" },
  city: { type: String, default: "" }
});
const User = mongoose.model("User", userSchema);

// Мидлвар для проверки токена

function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user._id, username: user.username }, 
        JWT_SECRET, 
        { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id, username: user.username }, 
        REFRESH_SECRET, 
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
}
// Регистрация пользователя
app.post('/register', async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(8).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, password } = req.body;

  try {
    console.log("Регистрация пользователя:", req.body);
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Увеличено количество раундов
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (err) {
    console.error("Ошибка регистрации:", err);
    res.status(500).json({ message: 'Ошибка регистрации пользователя', error: err.message });
  }
});

// Авторизация пользователя
app.post('/login', async (req, res) => {
  try {
    console.log("Запрос на логин:", req.body);

    const { username, password } = req.body;
    const user = await User.findOne({ username });

    console.log("Найден пользователь:", user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Неверные данные' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken });

  } catch (err) {
    console.error("Ошибка в /login:", err);
    res.status(500).json({ message: "Ошибка сервера", error: err.message });
  }
});
app.post('/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'Не авторизован' });
  jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Недействительный refresh-токен' });
    const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30m' });
    res.json({ accessToken });
  });
});
app.post('/logout', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    // Удаляем корзину пользователя
    await mongoose.connection.collection('carts').deleteOne({ userId: req.user.id });

    // Удаляем refreshToken из куки
    res.clearCookie('refreshToken');
    res.json({ message: 'Вы вышли из системы, корзина очищена' });

  } catch (error) {
    console.error("Ошибка при выходе:", error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

const logout = () => {
  // Удаление токена или данных авторизации
  localStorage.removeItem('token'); // если используется токен
  localStorage.removeItem('cart'); // удаление корзины

  // Очистка sessionStorage (если используется)
  sessionStorage.removeItem('cart');

  // Перенаправление на страницу входа
  window.location.href = '/login';
};
// Обновление токена
app.post('/refresh-token', (req, res) => {
  const { token: refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ message: 'Токен обновления не предоставлен' });
  }

  try {
    const user = jwt.verify(refreshToken, JWT_SECRET);
    const newAccessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Недействительный токен обновления' });
  }
});

// Приватный маршрут
app.get('/private-route', authMiddleware, (req, res) => {
  res.json({ message: `Добро пожаловать, пользователь ${req.user.id}` });
});
app.get('/account', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("username name city");
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }
        res.json({ username: user.username, name: user.name, city: user.city });
    } catch (error) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
});
app.put('/account', authMiddleware, async (req, res) => {
    const { name, city, username, password } = req.body; // Получаем данные из запроса

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        if (name) user.name = name;  // Обновляем имя
        if (city) user.city = city;  // Обновляем город
        if (username) user.username = username;  // Обновляем username
        if (password) user.password = await bcrypt.hash(password, 12);  // Обновляем пароль

        await user.save(); // Сохраняем обновлённые данные
        res.json({ message: 'Аккаунт обновлён', user });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении аккаунта', error: error.message });
    }
});
// Обработка корневого маршрута
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Проверка соединения
app.get("/connect", (req, res) => {
  res.send("Соединение с сервером успешно!");
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так!', error: err.message });
});

// Обработка 404 ошибок
app.use((req, res) => {
  res.status(404).json({ message: "Ресурс не найден" });
});

// Порт, на котором будет работать сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
