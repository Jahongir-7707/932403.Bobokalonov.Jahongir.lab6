'use strict';

const $ = (selector) => document.querySelector(selector);
const format = (value) => Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

function updateConnection() {
  const indicator = $('#connection-status');
  if (!indicator) return;
  const offline = !navigator.onLine;
  indicator.textContent = offline ? 'Офлайн-режим' : 'В сети';
  indicator.classList.toggle('offline', offline);
}

async function loadRates(currency) {
  const error = $('#error');
  if (!$('#chart')) return;
  error.hidden = true;
  try {
    // При отсутствии сети service worker вернёт кешированный ответ API.
    const response = await fetch(`/api/rates/${currency}`);
    if (!response.ok) throw new Error(`Ошибка HTTP ${response.status}`);
    const { rates, avg } = await response.json();

    $('#average').textContent = format(avg);
    $('#first-rate').textContent = format(rates[0]);
    $('#last-rate').textContent = format(rates[rates.length - 1]);
    const difference = Math.round((rates[rates.length - 1] - rates[0]) * 100) / 100;
    $('#change').textContent = `${difference > 0 ? '+' : ''}${format(difference)}`;
    $('#chart-title').textContent = `${currency} / RUB`;
    $('#api-link').textContent = `/api/rates/${currency} ↗`;
    $('#api-link').href = `/api/rates/${currency}`;

    const min = Math.min(...rates);
    const max = Math.max(...rates);
    // Пропорциональная визуальная высота с запасом для читаемости.
    const range = max - min || 1;
    const bars = rates.map((rate, index) => {
      const height = 50 + ((rate - min) / range) * 140;
      return `<div class="bar-col"><span class="bar-value">${format(rate)}</span><div class="bar" style="height:${height}px"></div><span class="bar-label">День ${index + 1}</span></div>`;
    });
    $('#chart').innerHTML = bars.join('');
    $('#data-mode').textContent = navigator.onLine ? 'API / кеш PWA' : 'Данные из кеша PWA';
  } catch (err) {
    error.textContent = `Не удалось получить курсы: ${err.message}. Откройте приложение один раз с подключением к сети.`;
    error.hidden = false;
    $('#data-mode').textContent = 'Ошибка загрузки';
  }
}

window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

const currencyButtons = document.querySelectorAll('[data-currency]');
currencyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currencyButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    loadRates(button.dataset.currency);
  });
});

if ($('#chart')) loadRates('USD');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker не зарегистрирован:', err);
    });
  });
}
