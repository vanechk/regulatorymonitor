const nodemailer = require('nodemailer');

console.log('🔍 Email: Инициализация email утилиты...');
console.log('🔍 Email: Текущая директория:', process.cwd());
console.log('🔍 Email: Переменные окружения:');
console.log('🔍 Email: EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('🔍 Email: EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('🔍 Email: EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔍 Email: EMAIL_PASS:', process.env.EMAIL_PASS ? 'установлен' : 'отсутствует');

// Создаем транспортер
console.log('🔍 Email: Создаю SMTP транспортер...');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mail.ru',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'aaa.bbb.11111@bk.ru',
    pass: process.env.EMAIL_PASS || 'GPIwiMhtlGOMqLz2a4YN'
  }
});

console.log('✅ Email: SMTP транспортер создан');
console.log('🔍 Email: Конфигурация транспортера:', {
  host: transporter.options.host,
  port: transporter.options.port,
  secure: transporter.options.secure,
  user: transporter.options.auth.user,
  pass: transporter.options.auth.pass ? '***' : 'отсутствует'
});

// Проверяем соединение
console.log('🔍 Email: Проверяю SMTP соединение...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email: Ошибка проверки SMTP соединения:', error);
    console.error('❌ Email: Детали ошибки SMTP:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
  } else {
    console.log('✅ Email: SMTP соединение успешно проверено');
    console.log('✅ Email: Сервер готов к отправке писем');
  }
});

async function sendVerificationEmail(email, username, verificationToken) {
  console.log('🔍 Email: sendVerificationEmail вызвана');
  console.log('🔍 Email: Параметры:', {
    email,
    username,
    verificationToken: verificationToken ? verificationToken.substring(0, 20) + '...' : 'отсутствует'
  });

  // Проверяем, является ли email тестовым (для разработки)
  const isTestEmail = email.includes('@example.com') || email.includes('@test.com');
  
  if (isTestEmail) {
    console.log('🧪 Email: Тестовый email обнаружен, имитирую отправку...');
    console.log('📧 Тестовые данные:');
    console.log('   От: aaa.bbb.11111@bk.ru');
    console.log('   Кому:', email);
    console.log('   Тема: Подтверждение регистрации - TaxNewsRadar');
    console.log('   URL подтверждения: http://localhost:5173/verify-email?token=' + verificationToken);
    
    // Имитируем задержку отправки
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Email: Тестовое письмо "отправлено" (имитация)');
    return true;
  }

  const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
  console.log('🔍 Email: URL подтверждения:', verificationUrl);

  const mailOptions = {
    from: process.env.EMAIL_USER || 'aaa.bbb.11111@bk.ru',
    to: email,
    subject: 'Подтверждение регистрации - TaxNewsRadar',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">TaxNewsRadar</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Подтверждение регистрации</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Привет, ${username}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Спасибо за регистрацию в TaxNewsRadar! Для завершения регистрации 
            необходимо подтвердить ваш email адрес.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Подтвердить Email
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:
          </p>
          
          <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px; color: #666;">
            ${verificationUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            <strong>Внимание:</strong> Эта ссылка действительна в течение 24 часов. 
            Если вы не регистрировались в TaxNewsRadar, просто проигнорируйте это письмо.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© 2025 TaxNewsRadar. Все права защищены.</p>
        </div>
      </div>
    `
  };

  console.log('🔍 Email: Настройки письма подготовлены');
  console.log('🔍 Email: От:', mailOptions.from);
  console.log('🔍 Email: Кому:', mailOptions.to);
  console.log('🔍 Email: Тема:', mailOptions.subject);

  try {
    console.log('🔍 Email: Отправляю письмо через SMTP...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email: Письмо успешно отправлено!');
    console.log('🔍 Email: Информация об отправке:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    return true;
  } catch (error) {
    console.error('❌ Email: Ошибка при отправке письма:', error);
    console.error('❌ Email: Детали ошибки отправки:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    
    throw new Error('Ошибка при отправке email с подтверждением');
  }
}

async function sendEmail(to, subject, content) {
  console.log('🔍 Email: sendEmail вызвана');
  console.log('🔍 Email: Параметры:', { to, subject, content: content ? 'установлен' : 'отсутствует' });

  const mailOptions = {
    from: process.env.EMAIL_USER || 'aaa.bbb.11111@bk.ru',
    to: to,
    subject: subject,
    html: content
  };

  try {
    console.log('🔍 Email: Отправляю обычное письмо...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email: Обычное письмо успешно отправлено!');
    console.log('🔍 Email: Информация об отправке:', {
      messageId: info.messageId,
      response: info.response
    });
    
    return true;
  } catch (error) {
    console.error('❌ Email: Ошибка при отправке обычного письма:', error);
    throw error;
  }
}

console.log('✅ Email: Email утилита инициализирована');
console.log('🔍 Email: Доступные функции: sendVerificationEmail, sendEmail');

module.exports = { sendVerificationEmail, sendEmail };
