/**
 * Telegram Bot Service
 * Обработка команд и отправка заявок
 */

const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');
const calculatorService = require('./calculator.service');

class TelegramService {
  constructor() {
    this.bot = null;
    this.adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id.trim())) || [];
  }

  /**
   * Инициализация бота
   */
  async init() {
    const token = process.env.BOT_TOKEN;

    if (!token) {
      logger.warn('BOT_TOKEN не установлен, Telegram бот не запущен');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });

      // Команда /start
      this.bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        this.bot.sendMessage(chatId,
          '🚗 *Онлайн калькулятор автокредитов*\\n\\n' +
          'Рассчитайте автокредит от ТОП-5 банков Узбекистана\\n\\n' +
          'Откройте приложение через кнопку меню 👇',
          { parse_mode: 'MarkdownV2' }
        );
      });

      // Команда /bank (только для админов)
      this.bot.onText(/\/bank/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!this.isAdmin(userId)) {
          return this.bot.sendMessage(chatId, '❌ Доступ запрещен');
        }

        try {
          const config = await calculatorService.loadConfig();
          const message = this.formatBanksConfig(config);

          await this.bot.sendMessage(chatId, message, {
            parse_mode: 'MarkdownV2'
          });
        } catch (error) {
          logger.error('Ошибка команды /bank', { error: error.message });
          this.bot.sendMessage(chatId, '❌ Ошибка загрузки конфигурации');
        }
      });

      // Команда /help
      this.bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        this.bot.sendMessage(chatId,
          '📖 *Помощь*\\n\\n' +
          '/start \\- Начать работу\\n' +
          '/help \\- Показать помощь\\n' +
          '/bank \\- Управление банками \\(админ\\)',
          { parse_mode: 'MarkdownV2' }
        );
      });

      logger.info('Telegram бот запущен');
    } catch (error) {
      logger.error('Ошибка инициализации Telegram бота', {
        error: error.message
      });
    }
  }

  /**
   * Проверка, является ли пользователь админом
   * @param {number} userId
   * @returns {boolean}
   */
  isAdmin(userId) {
    return this.adminIds.includes(userId);
  }

  /**
   * Форматирование конфигурации банков для отображения
   * @param {Object} config
   * @returns {string}
   */
  formatBanksConfig(config) {
    let message = '🏦 *Текущая конфигурация банков*\\n\\n';

    config.banks.forEach((bank, index) => {
      message += `${index + 1}\\. *${this.escapeMarkdown(bank.name)}*\\n`;
      message += `   Работает: ${bank.baseRate.working}%\\n`;
      message += `   Не работает: ${bank.baseRate.nonWorking}%\\n`;
      message += `   Мин\\. взнос: ${bank.minDownPayment}%\\n`;
      message += `   Макс\\. срок: ${bank.maxTermMonths} мес\\.\\n\\n`;
    });

    message += `📐 *Формула:* ${this.escapeMarkdown(config.formula.description)}\\n\\n`;
    message += `🕐 Обновлено: ${this.escapeMarkdown(new Date(config.lastUpdated).toLocaleString('ru-RU'))}`;

    return message;
  }

  /**
   * Отправить заявку в чат
   * @param {Object} application
   * @returns {Promise<void>}
   */
  async sendApplication(application) {
    if (!this.bot) {
      logger.warn('Telegram бот не инициализирован, заявка не отправлена');
      return;
    }

    try {
      const chatId = process.env.APPLICATIONS_CHAT_ID || this.adminIds[0];

      if (!chatId) {
        logger.warn('APPLICATIONS_CHAT_ID не установлен');
        return;
      }

      const message = this.formatApplication(application);

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'MarkdownV2'
      });

      logger.info('Заявка отправлена в Telegram', {
        chatId,
        username: application.input.username
      });
    } catch (error) {
      logger.error('Ошибка отправки заявки', {
        error: error.message
      });
    }
  }

  /**
   * Форматирование заявки для отправки
   * @param {Object} application
   * @returns {string}
   */
  formatApplication(application) {
    const { input, bestOffer, results } = application;

    let message = '📥 *Новая заявка на автокредит*\\n\\n';

    // Данные заявителя
    message += `👤 *Имя:* ${this.escapeMarkdown(input.name)}\\n`;
    message += `📱 *Username:* @${this.escapeMarkdown(input.username)}\\n`;
    message += `💼 *Статус:* ${input.isWorking ? 'Работает' : 'Не работает'}\\n\\n`;

    // Параметры кредита
    message += `🚗 *Стоимость авто:* ${this.formatNumber(input.carPrice)} ${input.currency}\\n`;
    message += `💰 *Первоначальный взнос:* ${this.formatNumber(input.downPayment)} ${input.currency} \\(${input.downPaymentPercent}%\\)\\n`;
    message += `💵 *Сумма кредита:* ${this.formatNumber(input.principal)} ${input.currency}\\n`;
    message += `📅 *Срок:* ${input.loanTerm} мес\\.\\n\\n`;

    // Результаты по банкам
    message += `🏦 *Предложения банков:*\\n\\n`;

    results.eligible.slice(0, 5).forEach((bank, index) => {
      const badge = index === 0 ? '✅ ' : '';
      message += `${badge}${this.escapeMarkdown(bank.name)} \\- ${bank.interestRate}%\\n`;
      message += `   Платеж: ${this.formatNumber(bank.monthlyPayment)} ${input.currency}/мес\\.\\n`;
      message += `   Переплата: ${this.formatNumber(bank.overpayment)} ${input.currency}\\n\\n`;
    });

    // Выбранный банк
    if (bestOffer) {
      message += `✨ *Лучшее предложение:* ${this.escapeMarkdown(bestOffer.name)}\\n`;
      message += `📞 *Контакт:* ${this.escapeMarkdown(bestOffer.contactPhone)}`;
    }

    return message;
  }

  /**
   * Экранирование спецсимволов Markdown V2
   * @param {string} text
   * @returns {string}
   */
  escapeMarkdown(text) {
    if (!text) return '';
    return text.toString().replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
  }

  /**
   * Форматирование числа
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    return this.escapeMarkdown(
      new Intl.NumberFormat('ru-RU').format(Math.round(num))
    );
  }
}

module.exports = new TelegramService();
