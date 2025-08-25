const nodemailer = require('nodemailer');

// Создаем транспортер для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mail.ru',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // true для 465, false для других портов
  auth: {
    user: process.env.EMAIL_USER || 'your-email@mail.ru',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Функция для отправки email с подтверждением
async function sendVerificationEmail(email: string, username: string, verificationToken: string) {
  // Принудительно используем localhost для разработки
  const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@mail.ru',
    to: email,
    subject: 'TaxNewsRadar - Подтверждение регистрации',
    html: `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TaxNewsRadar - Подтверждение регистрации</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
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
                    <p style="font-size: 18px; color: #1e293b; margin-bottom: 24px; font-weight: 500; text-align: left;">
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
                    <p style="margin-bottom: 8px; font-weight: 600; color: #1e293b; font-size: 16px;">© 2025 TaxNewsRadar</p>
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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Ошибка при отправке email с подтверждением');
  }
}

// Функция для отправки обычного email
async function sendEmail(to: string, subject: string, content: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@mail.ru',
    to,
    subject,
    html: content
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Ошибка при отправке email');
  }
}

// module.exports = {
//   sendVerificationEmail,
//   sendEmail
// };
