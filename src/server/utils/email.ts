import nodemailer from 'nodemailer';
import { db } from '../db';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Инициализирует SMTP транспортер
   */
  static async initializeTransporter(userId?: string): Promise<nodemailer.Transporter> {
    try {
      let config: EmailConfig;

      if (userId) {
        // Получаем настройки пользователя
        const userSettings = await db.emailSettings.findUnique({
          where: { userId }
        });

        if (userSettings && userSettings.smtpHost && userSettings.smtpUser && userSettings.smtpPass) {
          config = {
            host: userSettings.smtpHost,
            port: userSettings.smtpPort || 587,
            secure: userSettings.smtpSecure !== false,
            user: userSettings.smtpUser,
            pass: userSettings.smtpPass
          };
        } else {
          // Используем глобальные настройки
          config = await this.getGlobalConfig();
        }
      } else {
        // Используем глобальные настройки
        config = await this.getGlobalConfig();
      }

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Проверяем соединение
      await this.transporter.verify();
      console.log('SMTP соединение установлено успешно');

      return this.transporter;
    } catch (error) {
      console.error('Ошибка инициализации SMTP:', error);
      throw new Error('Не удалось инициализировать SMTP соединение');
    }
  }

  /**
   * Получает глобальные SMTP настройки из БД или переменных окружения
   */
  private static async getGlobalConfig(): Promise<EmailConfig> {
    // Сначала пытаемся получить из БД
    try {
      const systemSettings = await db.systemSettings.findUnique({
        where: { id: 'main' }
      });

      if (systemSettings && systemSettings.smtpHost && systemSettings.smtpUser && systemSettings.smtpPass) {
        return {
          host: systemSettings.smtpHost,
          port: systemSettings.smtpPort || 587,
          secure: systemSettings.smtpSecure !== false,
          user: systemSettings.smtpUser,
          pass: systemSettings.smtpPass
        };
      }
    } catch (error) {
      console.log('Не удалось получить SMTP настройки из БД, используем переменные окружения');
    }

    // Если в БД нет настроек, используем переменные окружения
    const envHost = process.env.EMAIL_HOST;
    const envUser = process.env.EMAIL_USER;
    const envPass = process.env.EMAIL_PASS;

    if (!envHost || !envUser || !envPass) {
      throw new Error('SMTP настройки не настроены ни в системе, ни в переменных окружения');
    }

    return {
      host: envHost,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // 465 порт обычно использует SSL
      user: envUser,
      pass: envPass
    };
  }

  /**
   * Отправляет email
   */
  static async sendEmail(content: EmailContent, userId?: string): Promise<void> {
    try {
      const transporter = await this.initializeTransporter(userId);

      const mailOptions = {
        from: userId ? undefined : (process.env.EMAIL_FROM || process.env.EMAIL_USER), // Для пользовательских настроек используем from из настроек
        to: content.to,
        subject: content.subject,
        html: content.html,
        text: content.text || this.htmlToText(content.html)
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email отправлен успешно:', result.messageId);

      // Логируем отправку
      if (userId) {
        await db.userAction.create({
          data: {
            userId,
            action: 'EMAIL_SENT',
            details: JSON.stringify({
              to: content.to,
              subject: content.subject,
              messageId: result.messageId
            })
          }
        });
      }
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      
      // Логируем ошибку
      if (userId) {
        await db.userAction.create({
          data: {
            userId,
            action: 'EMAIL_ERROR',
            details: JSON.stringify({
              to: content.to,
              subject: content.subject,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        });
      }
      
      throw new Error('Не удалось отправить email');
    }
  }

  /**
   * Отправляет тестовый email
   */
  static async sendTestEmail(to: string, userId?: string): Promise<void> {
    const testContent: EmailContent = {
      to,
      subject: 'Тестовое письмо - TaxNewsRadar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Тестовое письмо</h2>
          <p>Это тестовое письмо от системы TaxNewsRadar.</p>
          <p>Если вы получили это письмо, значит настройки SMTP работают корректно.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Отправлено: ${new Date().toLocaleString('ru-RU')}
          </p>
        </div>
      `
    };

    await this.sendEmail(testContent, userId);
  }

  /**
   * Отправляет email для верификации аккаунта
   */
  static async sendVerificationEmail(to: string, username: string, verificationToken: string, userId?: string): Promise<void> {
    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
    
    const verificationContent: EmailContent = {
      to,
      subject: 'TaxNewsRadar - Подтверждение регистрации',
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TaxNewsRadar - Подтверждение регистрации</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a202c; background: #f8fafc; min-height: 100vh; padding: 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 60px 40px 40px; text-align: center; position: relative;">
                      <div style="position: relative; z-index: 2;">
                        <div style="font-size: 32px; font-weight: 700; margin-bottom: 16px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); letter-spacing: -1px;">
                          TaxNewsRadar
                        </div>
                        <div style="width: 60px; height: 3px; background: #ffffff; margin: 0 auto 20px; border-radius: 2px;"></div>
                        <h1 style="margin: 0; font-size: 24px; font-weight: 600; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); position: relative; letter-spacing: -0.5px;">
                          Подтверждение регистрации
                        </h1>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px; background: #ffffff; position: relative;">
                      <!-- Welcome text -->
                      <p style="font-size: 18px; color: #1a293b; margin-bottom: 24px; font-weight: 500; text-align: left;">
                        Здравствуйте, <span style="color: #1e40af; font-weight: 600;">${username}</span>!
                      </p>
                      
                      <!-- Description -->
                      <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6; text-align: left; font-weight: 400;">
                        Благодарим за регистрацию в системе <span style="color: #1e40af; font-weight: 600;">TaxNewsRadar</span>. 
                        Для завершения регистрации необходимо подтвердить ваш email адрес.
                      </p>
                      
                      <!-- Verification button -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2); text-align: center; letter-spacing: -0.5px; border: none;">
                          Подтвердить Email
                        </a>
                      </div>
                      
                      <!-- Info box -->
                      <div style="background: #f1f5f9; padding: 24px; border-radius: 6px; margin: 32px 0; border-left: 4px solid #1e40af; position: relative;">
                        <p style="font-size: 14px; color: #475569; margin-bottom: 16px; font-weight: 500;">
                          <strong>Важно:</strong> Если кнопка не работает, скопируйте и вставьте следующую ссылку в браузер:
                        </p>
                        <a href="${verificationUrl}" style="color: #1e40af; word-break: break-all; text-decoration: none; font-weight: 500; padding: 12px; background: rgba(30, 64, 175, 0.1); border-radius: 4px; display: block; margin-top: 12px; border: 1px solid rgba(30, 64, 175, 0.2); font-family: 'Courier New', monospace; font-size: 12px;">
                          ${verificationUrl}
                        </a>
                      </div>
                      
                      <!-- Divider -->
                      <div style="height: 1px; background: #e2e8f0; margin: 32px 0;"></div>
                      
                      <!-- Final description -->
                      <p style="font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.5; text-align: left; font-weight: 400;">
                        <strong>Ваш аккаунт будет создан только после подтверждения email адреса.</strong> 
                        Ссылка действительна 24 часа. Если вы не регистрировались в TaxNewsRadar, 
                        просто проигнорируйте это письмо.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8fafc; padding: 32px 40px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">
                      <p style="margin-bottom: 8px; font-weight: 600; color: #1a293b; font-size: 16px;">© 2025 TaxNewsRadar</p>
                      <p style="margin-bottom: 8px;">Система мониторинга налоговых новостей</p>
                      <p style="margin-bottom: 0; font-size: 12px;">Это письмо отправлено автоматически</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await this.sendEmail(verificationContent, userId);
  }

  /**
   * Отправляет отчет по новостям
   */
  static async sendNewsReport(
    to: string, 
    newsItems: any[], 
    dateFrom: Date, 
    dateTo: Date,
    userId?: string
  ): Promise<void> {
    const reportContent: EmailContent = {
      to,
      subject: `Отчет по новостям за ${dateFrom.toLocaleDateString('ru-RU')} - ${dateTo.toLocaleDateString('ru-RU')}`,
      html: this.generateNewsReportHTML(newsItems, dateFrom, dateTo)
    };

    await this.sendEmail(reportContent, userId);
  }

  /**
   * Генерирует HTML для отчета по новостям
   */
  private static generateNewsReportHTML(newsItems: any[], dateFrom: Date, dateTo: Date): string {
    const newsItemsHTML = newsItems.map(item => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937;">
          <a href="${item.sourceUrl}" style="color: #2563eb; text-decoration: none;">${item.title}</a>
        </h3>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
          Источник: ${item.sourceName} | Дата: ${new Date(item.publishedAt).toLocaleDateString('ru-RU')}
        </p>
        <p style="margin: 0; color: #374151; line-height: 1.5;">
          ${item.summary}
        </p>
      </div>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: white; text-align: center;">TaxNewsRadar</h1>
          <p style="margin: 8px 0 0 0; color: #bfdbfe; text-align: center;">Отчет по налоговым новостям</p>
        </div>
        
        <div style="padding: 24px; background: #f9fafb;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px 0; color: #1f2937;">Период отчета</h2>
            <p style="margin: 0; color: #6b7280;">
              С ${dateFrom.toLocaleDateString('ru-RU')} по ${dateTo.toLocaleDateString('ru-RU')}
            </p>
            <p style="margin: 8px 0 0 0; color: #6b7280;">
              Найдено новостей: <strong>${newsItems.length}</strong>
            </p>
          </div>
          
          ${newsItems.length > 0 ? `
            <h2 style="margin: 0 0 16px 0; color: #1f2937;">Новости</h2>
            ${newsItemsHTML}
          ` : `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
              <p>За указанный период новостей не найдено.</p>
            </div>
          `}
        </div>
        
        <div style="background: #f3f4f6; padding: 16px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Отчет сгенерирован автоматически системой TaxNewsRadar
          </p>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">
            ${new Date().toLocaleString('ru-RU')}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Конвертирует HTML в простой текст
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Убираем HTML теги
      .replace(/&nbsp;/g, ' ') // Заменяем неразрывные пробелы
      .replace(/&amp;/g, '&') // Заменяем HTML сущности
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ') // Убираем множественные пробелы
      .trim();
  }

  /**
   * Проверяет SMTP соединение
   */
  static async testConnection(userId?: string): Promise<boolean> {
    try {
      const transporter = await this.initializeTransporter(userId);
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Ошибка проверки SMTP соединения:', error);
      return false;
    }
  }

  /**
   * Закрывает SMTP соединение
   */
  static async closeConnection(): Promise<void> {
    if (this.transporter) {
      await this.transporter.close();
      this.transporter = null;
      console.log('SMTP соединение закрыто');
    }
  }
}
