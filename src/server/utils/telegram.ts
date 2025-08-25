import axios from 'axios';
import { db } from '../db';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  disableWebPagePreview?: boolean;
}

export class TelegramService {
  private static botToken: string | null = null;
  private static defaultChatId: string | null = null;

  /**
   * Инициализирует сервис Telegram
   */
  static async initialize(): Promise<void> {
    try {
      // Получаем глобальные настройки
      const systemSettings = await db.systemSettings.findUnique({
        where: { id: 'main' }
      });

      if (systemSettings?.telegramBotToken) {
        this.botToken = systemSettings.telegramBotToken;
        console.log('Telegram бот инициализирован с глобальными настройками');
      } else {
        // Используем переменные окружения
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
        this.defaultChatId = process.env.TELEGRAM_CHAT_ID || null;
        
        if (this.botToken) {
          console.log('Telegram бот инициализирован с переменными окружения');
        } else {
          console.warn('Telegram бот не настроен - отсутствует токен');
        }
      }
    } catch (error) {
      console.error('Ошибка инициализации Telegram бота:', error);
    }
  }

  /**
   * Отправляет сообщение в Telegram
   */
  static async sendMessage(message: TelegramMessage, userId?: string): Promise<boolean> {
    try {
      if (!this.botToken) {
        throw new Error('Telegram бот не настроен');
      }

      let config: TelegramConfig;

      if (userId) {
        // Получаем настройки пользователя
        const userSettings = await db.telegramSettings.findUnique({
          where: { userId }
        });

        if (userSettings && userSettings.botToken && userSettings.chatId) {
          config = {
            botToken: userSettings.botToken,
            chatId: userSettings.chatId
          };
        } else {
          // Используем глобальные настройки
          config = await this.getGlobalConfig();
        }
      } else {
        // Используем глобальные настройки
        config = await this.getGlobalConfig();
      }

      const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
      
      const response = await axios.post(url, {
        chat_id: message.chatId || config.chatId,
        text: message.text,
        parse_mode: message.parseMode || 'HTML',
        disable_web_page_preview: message.disableWebPagePreview || true
      });

      if (response.data.ok) {
        console.log('Telegram сообщение отправлено успешно');
        
        // Логируем отправку
        if (userId) {
          await db.userAction.create({
            data: {
              userId,
              action: 'TELEGRAM_SENT',
              details: JSON.stringify({
                chatId: message.chatId || config.chatId,
                messageId: response.data.result.message_id
              })
            }
          });
        }
        
        return true;
      } else {
        throw new Error(`Telegram API error: ${response.data.description}`);
      }
    } catch (error) {
      console.error('Ошибка отправки Telegram сообщения:', error);
      
      // Логируем ошибку
      if (userId) {
        await db.userAction.create({
          data: {
            userId,
            action: 'TELEGRAM_ERROR',
            details: JSON.stringify({
              chatId: message.chatId,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        });
      }
      
      return false;
    }
  }

  /**
   * Получает глобальные настройки Telegram
   */
  private static async getGlobalConfig(): Promise<TelegramConfig> {
    const systemSettings = await db.systemSettings.findUnique({
      where: { id: 'main' }
    });

    if (!systemSettings?.telegramBotToken) {
      throw new Error('Telegram настройки не настроены в системе');
    }

    return {
      botToken: systemSettings.telegramBotToken,
      chatId: this.defaultChatId || ''
    };
  }

  /**
   * Отправляет тестовое сообщение
   */
  static async sendTestMessage(chatId: string, userId?: string): Promise<boolean> {
    const testMessage: TelegramMessage = {
      chatId,
      text: `🧪 <b>Тестовое сообщение</b>\n\nЭто тестовое сообщение от системы TaxNewsRadar.\n\nЕсли вы получили это сообщение, значит настройки Telegram работают корректно.\n\n📅 Отправлено: ${new Date().toLocaleString('ru-RU')}`,
      parseMode: 'HTML'
    };

    return await this.sendMessage(testMessage, userId);
  }

  /**
   * Отправляет отчет по новостям
   */
  static async sendNewsReport(
    chatId: string,
    newsItems: any[],
    dateFrom: Date,
    dateTo: Date,
    userId?: string
  ): Promise<boolean> {
    const reportText = this.generateNewsReportText(newsItems, dateFrom, dateTo);
    
    const message: TelegramMessage = {
      chatId,
      text: reportText,
      parseMode: 'HTML'
    };

    return await this.sendMessage(message, userId);
  }

  /**
   * Генерирует текст отчета для Telegram
   */
  private static generateNewsReportText(newsItems: any[], dateFrom: Date, dateTo: Date): string {
    const period = `${dateFrom.toLocaleDateString('ru-RU')} - ${dateTo.toLocaleDateString('ru-RU')}`;
    const count = newsItems.length;
    
    let report = `📊 <b>Отчет по налоговым новостям</b>\n\n`;
    report += `📅 <b>Период:</b> ${period}\n`;
    report += `📈 <b>Найдено новостей:</b> ${count}\n\n`;
    
    if (count > 0) {
      report += `📰 <b>Новости:</b>\n\n`;
      
      // Ограничиваем количество новостей для Telegram (максимум 10)
      const limitedNews = newsItems.slice(0, 10);
      
      limitedNews.forEach((item, index) => {
        const title = item.title.length > 100 ? item.title.substring(0, 100) + '...' : item.title;
        const source = item.sourceName || 'Неизвестный источник';
        const date = new Date(item.publishedAt).toLocaleDateString('ru-RU');
        
        report += `${index + 1}. <b>${title}</b>\n`;
        report += `   📍 ${source} | 📅 ${date}\n`;
        report += `   🔗 <a href="${item.sourceUrl}">Читать далее</a>\n\n`;
      });
      
      if (count > 10) {
        report += `... и еще ${count - 10} новостей\n\n`;
      }
    } else {
      report += `😔 За указанный период новостей не найдено.\n\n`;
    }
    
    report += `⏰ Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}\n`;
    report += `🤖 TaxNewsRadar`;
    
    return report;
  }

  /**
   * Проверяет соединение с Telegram
   */
  static async testConnection(userId?: string): Promise<boolean> {
    try {
      if (!this.botToken) {
        return false;
      }

      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await axios.get(url);
      
      return response.data.ok;
    } catch (error) {
      console.error('Ошибка проверки соединения с Telegram:', error);
      return false;
    }
  }

  /**
   * Получает информацию о боте
   */
  static async getBotInfo(): Promise<any> {
    try {
      if (!this.botToken) {
        throw new Error('Telegram бот не настроен');
      }

      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await axios.get(url);
      
      if (response.data.ok) {
        return response.data.result;
      } else {
        throw new Error(`Telegram API error: ${response.data.description}`);
      }
    } catch (error) {
      console.error('Ошибка получения информации о боте:', error);
      throw error;
    }
  }
}
