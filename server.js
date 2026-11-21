'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// Учебные данные. Курсы фиктивные и не являются реальными котировками.
const ratesByCurrency = {
  USD: [90, 91, 92, 93, 94, 95, 96],
  EUR: [98, 99, 97, 100, 101, 102, 99],
  CNY: [12.3, 12.4, 12.5, 12.6, 12.5, 12.7, 12.8]
};

// Маршруты HTML-страниц.
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(publicDir, 'about.html'));
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Сервер работает' });
});

// :currency — параметр пути. Query-параметры (например, ?test=1)
// по условию варианта игнорируются.
app.get('/api/rates/:currency', (req, res) => {
  const currency = req.params.currency.toUpperCase();
  const rates = ratesByCurrency[currency];

  if (!rates) {
    return res.status(404).json({
      error: 'Валюта не поддерживается',
      supported: Object.keys(ratesByCurrency)
    });
  }

  const sum = rates.reduce((total, value) => total + value, 0);
  const avg = Math.round((sum / rates.length) * 100) / 100;

  res.json({ currency, rates, avg });
});

// Статические HTML, CSS, JS, manifest, service worker и иконки.
app.use(express.static(publicDir));

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
