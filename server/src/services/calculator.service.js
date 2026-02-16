/**
 * Сервис для расчета автокредитов
 * Использует аннуитетную формулу из banks.config.json
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class CalculatorService {
  constructor() {
    this.configPath = path.join(__dirname, '../../banks.config.json');
  }

  /**
   * Загрузить конфигурацию банков
   * @returns {Object}
   */
  async loadConfig() {
    try {
      const config = await fs.readJson(this.configPath);
      return config;
    } catch (error) {
      logger.error('Ошибка загрузки banks.config.json', {
        error: error.message
      });
      throw new Error('Не удалось загрузить конфигурацию банков');
    }
  }

  /**
   * Рассчитать ежемесячный платеж по аннуитетной формуле
   * M = P × (r(1+r)^n) / ((1+r)^n - 1)
   *
   * @param {number} principal - Сумма кредита
   * @param {number} annualRate - Годовая процентная ставка
   * @param {number} months - Срок в месяцах
   * @returns {number} Ежемесячный платеж
   */
  calculateMonthlyPayment(principal, annualRate, months) {
    if (principal <= 0 || months <= 0) {
      throw new Error('Некорректные данные для расчета');
    }

    // Если ставка 0%
    if (annualRate === 0) {
      return principal / months;
    }

    // Месячная ставка (в долях)
    const r = annualRate / 12 / 100;

    // (1 + r)^n
    const pow = Math.pow(1 + r, months);

    // Аннуитетный платеж
    const monthlyPayment = principal * (r * pow) / (pow - 1);

    return Math.round(monthlyPayment * 100) / 100;
  }

  /**
   * Рассчитать полную стоимость кредита
   * @param {number} monthlyPayment - Ежемесячный платеж
   * @param {number} months - Срок в месяцах
   * @returns {number} Общая сумма выплат
   */
  calculateTotalPayment(monthlyPayment, months) {
    return Math.round(monthlyPayment * months * 100) / 100;
  }

  /**
   * Рассчитать переплату
   * @param {number} totalPayment - Общая сумма выплат
   * @param {number} principal - Сумма кредита
   * @returns {number} Переплата
   */
  calculateOverpayment(totalPayment, principal) {
    return Math.round((totalPayment - principal) * 100) / 100;
  }

  /**
   * Рассчитать кредит для всех банков
   * @param {Object} params
   * @param {string} params.name - Имя заявителя
   * @param {string} params.username - Telegram username
   * @param {number} params.carPrice - Стоимость автомобиля
   * @param {number} params.downPayment - Первоначальный взнос
   * @param {string} params.currency - Валюта (UZS/USD)
   * @param {number} params.loanTerm - Срок кредита (месяцы)
   * @param {boolean} params.isWorking - Работает ли заявитель
   * @returns {Promise<Object>} Результаты расчета для всех банков
   */
  async calculateForAllBanks(params) {
    const {
      name,
      username,
      carPrice,
      downPayment,
      currency,
      loanTerm,
      isWorking
    } = params;

    // Валидация
    if (downPayment >= carPrice) {
      throw new Error('Первоначальный взнос не может быть больше стоимости авто');
    }

    // Сумма кредита
    const principal = carPrice - downPayment;
    const downPaymentPercent = Math.round((downPayment / carPrice) * 100);

    // Загружаем конфигурацию банков
    const config = await this.loadConfig();

    // Рассчитываем для каждого банка
    const results = config.banks
      .filter(bank => bank.active)
      .map(bank => {
        // Выбираем ставку в зависимости от занятости
        const interestRate = isWorking
          ? bank.baseRate.working
          : bank.baseRate.nonWorking;

        // Проверка минимального первоначального взноса
        if (downPaymentPercent < bank.minDownPayment) {
          return {
            ...bank,
            interestRate,
            eligible: false,
            reason: `Минимальный первоначальный взнос: ${bank.minDownPayment}%`
          };
        }

        // Проверка максимального срока
        if (loanTerm > bank.maxTermMonths) {
          return {
            ...bank,
            interestRate,
            eligible: false,
            reason: `Максимальный срок кредита: ${bank.maxTermMonths} мес.`
          };
        }

        // Расчет платежей
        const monthlyPayment = this.calculateMonthlyPayment(
          principal,
          interestRate,
          loanTerm
        );

        const totalPayment = this.calculateTotalPayment(
          monthlyPayment,
          loanTerm
        );

        const overpayment = this.calculateOverpayment(
          totalPayment,
          principal
        );

        return {
          id: bank.id,
          name: bank.name,
          logo: bank.logo,
          website: bank.website,
          description: bank.description,
          interestRate,
          monthlyPayment,
          totalPayment,
          overpayment,
          principal,
          features: bank.features,
          contactPhone: bank.contactPhone,
          eligible: true,
          reason: null
        };
      });

    // Сортируем по размеру переплаты (лучшие предложения первыми)
    const eligibleResults = results
      .filter(r => r.eligible)
      .sort((a, b) => a.overpayment - b.overpayment);

    const ineligibleResults = results.filter(r => !r.eligible);

    return {
      input: {
        name,
        username,
        carPrice,
        downPayment,
        downPaymentPercent,
        currency,
        loanTerm,
        isWorking,
        principal
      },
      results: {
        eligible: eligibleResults,
        ineligible: ineligibleResults,
        total: results.length,
        eligibleCount: eligibleResults.length
      },
      bestOffer: eligibleResults.length > 0 ? eligibleResults[0] : null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Получить список всех банков
   * @returns {Promise<Array>}
   */
  async getBanks() {
    const config = await this.loadConfig();
    return config.banks;
  }

  /**
   * Обновить конфигурацию банков
   * @param {Object} newConfig
   * @returns {Promise<void>}
   */
  async updateBanksConfig(newConfig) {
    try {
      // Валидация структуры
      if (!newConfig.banks || !Array.isArray(newConfig.banks)) {
        throw new Error('Некорректная структура конфигурации');
      }

      // Сохраняем с красивым форматированием
      await fs.writeJson(this.configPath, newConfig, { spaces: 2 });

      logger.info('Конфигурация банков обновлена');
    } catch (error) {
      logger.error('Ошибка обновления конфигурации', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new CalculatorService();
