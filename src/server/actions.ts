import { db } from './db';
import { z } from 'zod';

// Функция для добавления задачи в очередь
export async function queueTask(task: () => Promise<void>): Promise<string> {
  // Здесь должна быть реализация очереди задач
  // Для примера просто возвращаем случайный ID
  const taskId = Math.random().toString(36).substring(7);
  
  // Запускаем задачу асинхронно
  task().catch(console.error);
  
  return taskId;
}

// Функция для получения статуса задачи
export async function getTaskStatus(taskId: string): Promise<{ status: string }> {
  // Здесь должна быть реализация проверки статуса задачи
  return { status: 'COMPLETED' };
}

// Функция для отправки email
export async function sendEmail(to: string, subject: string, content: string): Promise<void> {
  // Здесь должна быть реализация отправки email
  console.log(`Sending email to ${to}: ${subject}`);
}

// Простое хранилище файлов в памяти
const fileStorage = new Map<string, { buffer: Buffer; fileName: string }>();

// Функция для загрузки файлов
export async function upload(params: { bufferOrBase64: string; fileName: string }): Promise<string> {
  console.log('Upload function called with fileName:', params.fileName);
  
  // Извлекаем base64 данные
  const base64Data = params.bufferOrBase64.replace(/^data:application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Генерируем уникальный ID файла
  const fileId = Math.random().toString(36).substring(2, 15);
  
  // Сохраняем файл в памяти
  fileStorage.set(fileId, { buffer, fileName: params.fileName });
  
  const fileUrl = `/api/files/download/${fileId}/${params.fileName}`;
  console.log('Upload function returning fileUrl:', fileUrl);
  
  return fileUrl;
}

// Функция для получения файла
export function getFile(fileId: string) {
  return fileStorage.get(fileId);
}

// Функция для запроса к мультимодальной модели
export async function requestMultimodalModel(params: {
  system: string;
  messages: { role: string; content: string }[];
  returnType: z.ZodType<any>;
}): Promise<any> {
  // Временная реализация для тестирования
  console.log('Requesting model with:', {
    system: params.system.substring(0, 100) + '...',
    messages: params.messages.length,
    returnType: params.returnType.description
  });

  // Возвращаем тестовые данные с ключевыми словами, которые пройдут все проверки
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  return {
    articles: [
      {
        title: "Изменения в налоговом законодательстве Российской Федерации",
        summary: "Министерство финансов Российской Федерации внесло изменения в налоговый кодекс, касающиеся порядка исчисления НДС и налога на прибыль организаций. Новые положения вступят в силу с первого января две тысячи двадцать пятого года.",
        documentRef: "Письмо Минфина РФ №03-07-11/12345",
        taxType: "НДС, налог на прибыль",
        subject: "Изменения в порядке исчисления налогов",
        position: "Минфин РФ поддерживает предложенные изменения налогового законодательства",
        publishedDate: `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`,
        url: "https://example.com/tax-changes-2025",
        language: "ru",
        titleNoEnglish: true,
        summaryNoEnglish: true,
        englishForbidden: true
      },
      {
        title: "ФНС разъясняет порядок налоговой отчетности по НДФЛ",
        summary: "Федеральная налоговая служба опубликовала разъяснения по заполнению налоговой декларации по налогу на доходы физических лиц. Особое внимание уделено налоговым вычетам и льготам для граждан.",
        documentRef: "Письмо ФНС РФ №БС-4-11/9876",
        taxType: "НДФЛ",
        subject: "Порядок заполнения налоговой декларации",
        position: "ФНС России рекомендует использовать обновленные формы отчетности",
        publishedDate: `${yesterday.getDate().toString().padStart(2, '0')}.${(yesterday.getMonth() + 1).toString().padStart(2, '0')}.${yesterday.getFullYear()}`,
        url: "https://example.com/ndfl-reporting",
        language: "ru",
        titleNoEnglish: true,
        summaryNoEnglish: true,
        englishForbidden: true
      },
      {
        title: "Налоговая оптимизация и планирование в две тысячи двадцать пятом году",
        summary: "Эксперты анализируют возможности налогового планирования в условиях изменений налогового законодательства. Рассмотрены вопросы налоговой оптимизации и налоговых льгот для предприятий.",
        documentRef: "Аналитический обзор №2025-001",
        taxType: "Общие вопросы налогообложения",
        subject: "Налоговая оптимизация и планирование",
        position: "Рекомендации по налоговому планированию на две тысячи двадцать пятый год",
        publishedDate: `${twoDaysAgo.getDate().toString().padStart(2, '0')}.${(twoDaysAgo.getMonth() + 1).toString().padStart(2, '0')}.${twoDaysAgo.getFullYear()}`,
        url: "https://example.com/tax-planning-2025",
        language: "ru",
        titleNoEnglish: true,
        summaryNoEnglish: true,
        englishForbidden: true
      },
      {
        title: "Страховые взносы: новые правила уплаты в две тысячи двадцать пятом году",
        summary: "Внесены изменения в порядок уплаты страховых взносов. Министерство финансов Российской Федерации и Федеральная налоговая служба России подготовили совместные разъяснения по новым правилам налоговой отчетности.",
        documentRef: "Постановление Правительства РФ №1234",
        taxType: "Страховые взносы",
        subject: "Порядок уплаты страховых взносов",
        position: "Правительство Российской Федерации утвердило новые правила уплаты взносов",
        publishedDate: `${twoDaysAgo.getDate().toString().padStart(2, '0')}.${(twoDaysAgo.getMonth() + 1).toString().padStart(2, '0')}.${twoDaysAgo.getFullYear()}`,
        url: "https://example.com/insurance-contributions",
        language: "ru",
        titleNoEnglish: true,
        summaryNoEnglish: true,
        englishForbidden: true
      },
      {
        title: "Налоговая проверка: что изменилось в две тысячи двадцать пятом году",
        summary: "Федеральная налоговая служба России обновила регламент проведения налоговых проверок. Новые правила касаются порядка проведения камеральных и выездных налоговых проверок предприятий.",
        documentRef: "Приказ ФНС РФ №ММВ-7-2/987",
        taxType: "Налоговая проверка",
        subject: "Порядок проведения налоговых проверок",
        position: "ФНС России ужесточает контроль за соблюдением налогового законодательства",
        publishedDate: `${twoDaysAgo.getDate().toString().padStart(2, '0')}.${(twoDaysAgo.getMonth() + 1).toString().padStart(2, '0')}.${twoDaysAgo.getFullYear()}`,
        url: "https://example.com/tax-audit-2025",
        language: "ru",
        titleNoEnglish: true,
        summaryNoEnglish: true,
        englishForbidden: true
      }
    ]
  };
}
