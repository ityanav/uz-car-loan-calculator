/**
 * Сервис для работы с курсами валют Центрального банка Узбекистана
 * API: https://cbu.uz/ru/arkhiv-kursov-valyut/json/
 */

const axios = require('axios');
const logger = require('../utils/logger');

class CurrencyService {
  constructor() {
    this.cbuApiUrl = 'https://cbu.uz/ru/arkhiv-kursov-valyut/json/';
    this.cache = {
      rates: null,
      lastUpdate: null,
      cacheTime: 12 * 60 * 60 * 1000 // 12 часов в миллисекундах
    };
  }

  /**
   * Получить актуальные курсы валют
   * @returns {Promise<Object>} Курсы валют
   */
  async getRates() {
    try {
      // Проверяем кэш
      if (this.isCacheValid()) {
        logger.info('Используем кэшированные курсы валют');
        return this.cache.rates;
      }

      // Запрашиваем свежие данные
      logger.info('Запрос курсов валют с ЦБ Узбекистана');
      const response = await axios.get(this.cbuApiUrl, {
        timeout: 10000
      });

      const rates = this.parseRates(response.data);

      // Сохраняем в кэш
      this.cache.rates = rates;
      this.cache.lastUpdate = Date.now();

      logger.info('Курсы валют обновлены', { usd: rates.USD });

      return rates;
    } catch (error) {
      logger.error('Ошибка при получении курсов валют', {
        error: error.message
      });

      // Если есть кэш - возвращаем его
      if (this.cache.rates) {
        logger.warn('Используем устаревший кэш курсов валют');
        return this.cache.rates;
      }

      // Если кэша нет - возвращаем фоллбэк
      return this.getFallbackRates();
    }
  }

  /**
   * Парсинг данных от ЦБУ
   * @param {Array} data - Массив валют от API
   * @returns {Object} Обработанные курсы
   */
  parseRates(data) {
    const rates = {
      USD: null,
      EUR: null,
      RUB: null,
      lastUpdate: new Date().toISOString()
    };

    data.forEach(currency => {
      if (currency.Ccy === 'USD') {
        rates.USD = parseFloat(currency.Rate);
      } else if (currency.Ccy === 'EUR') {
        rates.EUR = parseFloat(currency.Rate);
      } else if (currency.Ccy === 'RUB') {
        rates.RUB = parseFloat(currency.Rate);
      }
    });

    return rates;
  }

  /**
   * Проверка валидности кэша
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.cache.rates || !this.cache.lastUpdate) {
      return false;
    }

    const age = Date.now() - this.cache.lastUpdate;
    return age < this.cache.cacheTime;
  }

  /**
   * Фоллбэк курсы (если API недоступен)
   * @returns {Object}
   */
  getFallbackRates() {
    logger.warn('Используем фоллбэк курсы валют');
    return {
      USD: 12820.00, // Примерный курс
      EUR: 13850.00,
      RUB: 135.00,
      lastUpdate: new Date().toISOString(),
      isFallback: true
    };
  }

  /**
   * Конвертация валюты
   * @param {number} amount - Сумма
   * @param {string} from - Исходная валюта
   * @param {string} to - Целевая валюта
   * @returns {Promise<number>} Конвертированная сумма
   */
  async convert(amount, from, to) {
    if (from === to) {
      return amount;
    }

    const rates = await this.getRates();

    // Конвертация в UZS
    if (to === 'UZS') {
      const rate = rates[from];
      if (!rate) {
        throw new Error(`Курс для ${from} не найден`);
      }
      return Math.round(amount * rate);
    }

    // Конвертация из UZS
    if (from === 'UZS') {
      const rate = rates[to];
      if (!rate) {
        throw new Error(`Курс для ${to} не найден`);
      }
      return Math.round((amount / rate) * 100) / 100;
    }

    // Кросс-конвертация через UZS
    const uzsAmount = await this.convert(amount, from, 'UZS');
    return await this.convert(uzsAmount, 'UZS', to);
  }

  /**
   * Получить информацию о кэше
   * @returns {Object}
   */
  getCacheInfo() {
    return {
      hasCache: !!this.cache.rates,
      lastUpdate: this.cache.lastUpdate,
      age: this.cache.lastUpdate ? Date.now() - this.cache.lastUpdate : null,
      isValid: this.isCacheValid()
    };
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    this.cache.rates = null;
    this.cache.lastUpdate = null;
    logger.info('Кэш курсов валют очищен');
  }
}

module.exports = new CurrencyService();
