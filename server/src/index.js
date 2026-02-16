/**
 * Main Server File
 * Uz Car Loan Calculator API
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const currencyService = require('./services/currency.service');
const calculatorService = require('./services/calculator.service');
const telegramService = require('./services/telegram.service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // 100 запросов
});
app.use(limiter);

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/currency - Получить курсы валют
app.get('/api/currency', async (req, res) => {
  try {
    const rates = await currencyService.getRates();
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    logger.error('Ошибка получения курсов', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Ошибка получения курсов валют'
    });
  }
});

// GET /api/banks - Получить список банков
app.get('/api/banks', async (req, res) => {
  try {
    const banks = await calculatorService.getBanks();
    res.json({
      success: true,
      data: { banks }
    });
  } catch (error) {
    logger.error('Ошибка получения банков', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Ошибка получения списка банков'
    });
  }
});

// POST /api/calculate - Рассчитать кредит
app.post('/api/calculate', async (req, res) => {
  try {
    const {
      name,
      username,
      carPrice,
      downPayment,
      currency,
      loanTerm,
      isWorking
    } = req.body;

    // Валидация
    if (!name || !carPrice || !downPayment || !loanTerm || typeof isWorking !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Заполните все обязательные поля'
      });
    }

    // Конвертация в UZS если нужно
    let carPriceUzs = carPrice;
    let downPaymentUzs = downPayment;

    if (currency === 'USD') {
      carPriceUzs = await currencyService.convert(carPrice, 'USD', 'UZS');
      downPaymentUzs = await currencyService.convert(downPayment, 'USD', 'UZS');
    }

    // Расчет
    const result = await calculatorService.calculateForAllBanks({
      name,
      username: username || 'unknown',
      carPrice: carPriceUzs,
      downPayment: downPaymentUzs,
      currency: 'UZS',
      loanTerm,
      isWorking
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Ошибка расчета', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка расчета'
    });
  }
});

// POST /api/application - Отправить заявку
app.post('/api/application', async (req, res) => {
  try {
    const application = req.body;

    // Отправляем в Telegram
    await telegramService.sendApplication(application);

    res.json({
      success: true,
      message: 'Заявка отправлена'
    });
  } catch (error) {
    logger.error('Ошибка отправки заявки', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Ошибка отправки заявки'
    });
  }
});

// POST /api/admin/update-banks - Обновить конфигурацию банков (admin only)
app.post('/api/admin/update-banks', async (req, res) => {
  try {
    const newConfig = req.body;

    await calculatorService.updateBanksConfig(newConfig);

    res.json({
      success: true,
      message: 'Конфигурация обновлена'
    });
  } catch (error) {
    logger.error('Ошибка обновления конфигурации', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления конфигурации'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint не найден'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Необработанная ошибка', {
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера'
  });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 Сервер запущен на порту ${PORT}`);

  // Инициализация Telegram бота
  await telegramService.init();

  // Предзагрузка курсов валют
  try {
    await currencyService.getRates();
    logger.info('Курсы валют загружены');
  } catch (error) {
    logger.error('Ошибка загрузки курсов', { error: error.message });
  }
});
