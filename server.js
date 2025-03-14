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
  'https://mobile-site.onrender.com',
  'http://localhost:3000', // Для локальной разработки
];
require("dotenv").config();

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
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        console.log("Проверка протокола:", req.headers["x-forwarded-proto"]);
        
        // ✅ Проверяем, что уже на HTTPS и редирект не повторяется
        if (req.headers["x-forwarded-proto"] !== "https" && !req.secure) {
            console.log("🔄 Перенаправление на HTTPS...");
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
    }
    next();
});
// Подключение к MongoDB
const JWT_SECRET = process.env.JWT_SECRET || "ai3ohPh3Aiy9eeThoh8caaM9voh5Aezaenai0Fae2Pahsh2Iexu7Qu/";
const mongoURI = process.env.MONGO_URI || "mongodb://11_ifelephant:ee590bdf579c7404d12fd8cf0990314242d56e62@axs-h.h.filess.io:27018/11_ifelephant";
const _SECRET = process.env._SECRET || "J8$GzP1d&KxT^m4YvNcR";
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
    if (!token) return res.status(401).json({ message: "Токен не предоставлен" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Недействительный токен" });
    }
};

async function fetchWithAuth(url, options = {}) {
    let accessToken = localStorage.getItem("accessToken");

    if (!accessToken || isTokenExpired(accessToken)) {
        console.log("🔄 Токен истек, запрашиваем новый...");
        const response = await fetch("/refresh", { method: "POST", credentials: "include" });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("accessToken", data.accessToken);
            accessToken = data.accessToken;
        } else {
            console.warn("❌ Ошибка обновления токена:", data.message);
            return null;
        }
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`
        }
    });
}


// Функция проверки срока жизни токена
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Декодируем токен
        return payload.exp * 1000 < Date.now(); // Если exp в прошлом — токен истёк
    } catch (e) {
        return true; // Если ошибка — токен недействителен
    }
}
async function AccessToken(req, res) {
    if (!req || !req.cookies) {
        console.error("❌ Ошибка: req или req.cookies отсутствуют!");
        return null;
    }

    console.log("🔄 Сервер: Попытка обновления токена...");
    
    const Token = req.cookies.TokenMobile;
console.log("🔍 Полученный TokenMobile:", Token);
if (!Token) {
    console.warn("❌ Нет TokenMobile, отправляем 401.");
    return res.status(401).json({ message: "Не авторизован" });
}

    jwt.verify(Token, _SECRET, async (err, decodedUser) => {
        if (err) {
            console.warn("❌ Недействительный -токен, отправляем 403.");
            return res.status(403).json({ message: "Недействительный -токен" });
        }

        const user = await User.findById(decodedUser.id);
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, req.headers.origin);

        console.log("✅ Новый access-токен сгенерирован.");
        
        res.cookie(decodedUser.site === "https://makadamia.onrender.com" ? "refreshTokenDesktop" : "refreshTokenMobile", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
            partitioned: true
        });

        res.json({ accessToken });
    });
}

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
    const issuedAt = Math.floor(Date.now() / 1000);
    const accessToken = jwt.sign(
        { id: user._id, username: user.username, iat: issuedAt },
        JWT_SECRET,
        { expiresIn: "30m" } // Access-токен живёт 30 минут
    );

    const refreshToken = jwt.sign(
        { id: user._id, username: user.username, iat: issuedAt },
        REFRESH_SECRET,
        { expiresIn: "7d" } // Refresh-токен живёт 7 дней
    );

    return { accessToken, refreshToken };
}


// Регистрация пользователя
app.post('/register', async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().trim().min(3).max(30).required(),
    password: Joi.string().min(8).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, password } = req.body;

  try {
    console.log("Регистрация пользователя:", username);

    // Проверяем наличие пользователя
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.warn(`Пользователь "${username}" уже существует.`);
      return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, password: hashedPassword });

    // Пробуем сохранить пользователя
    await newUser.save();

    console.log(`Пользователь "${username}" успешно зарегистрирован.`);
    return res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });

  } catch (err) {
    console.error("Ошибка регистрации:", err);

    // Проверка на дублирование (если не проверило выше)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Такой пользователь уже существует' });
    }

    return res.status(500).json({ message: 'Ошибка регистрации пользователя', error: err.message });
  }
});


// Авторизация пользователя
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Неверные данные' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie("refreshTokenMobile", refreshToken, {
        httpOnly: true,  
        secure: true,    
        sameSite: "None", 
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000 // ✅ 30 дней хранения
    });

    res.json({ accessToken });
});


app.post('/refresh', async (req, res) => {
    console.log("🔍 Все куки в запросе /refresh:", req.cookies);

    const refreshToken = req.cookies.refreshTokenMobile; // ✅ Теперь сервер видит куки
    if (!refreshToken) {
        console.warn("❌ Нет refreshTokenMobile в cookies");
        return res.status(401).json({ message: "Не авторизован" });
    }

    jwt.verify(refreshToken, REFRESH_SECRET, async (err, decodedUser) => {
        if (err) {
            console.warn("❌ Недействительный refresh-токен");
            res.clearCookie("refreshTokenMobile", { httpOnly: true, secure: true, sameSite: "None", path: "/" });
            return res.status(403).json({ message: "Недействительный refresh-токен" });
        }

        const user = await User.findById(decodedUser.id);
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        res.cookie("refreshTokenMobile", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000  // ✅ Кука обновляется на 30 дней
        });

        res.json({ accessToken });
    });
});

app.post('/logout', authMiddleware, (req, res) => {
    res.clearCookie("refreshTokenMobile", {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: "/",
        domain: "mobile-site.onrender.com"
    });

    res.json({ message: 'Вы вышли из системы' });
});


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
        console.log("🔍 Все куки в запросе /account:", req.cookies);

        const user = await User.findById(req.user.id).select("username name city");
        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        res.json({ username: user.username, name: user.name, city: user.city });

    } catch (error) {
        console.error("❌ Ошибка при получении данных аккаунта:", error);
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
