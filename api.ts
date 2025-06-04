import { db } from './src/server/db';
import { type NewsItem, type Source, type Keyword, type Report, type EmailSettings } from '~/types/api';
import { queueTask, getTaskStatus, sendEmail, upload, requestMultimodalModel as requestModel } from './src/server/actions';
import { z } from 'zod';
import * as ExcelJS from "exceljs";

// Source management
export async function listSources() {
  return await db.source.findMany({
    orderBy: { name: "asc" },
  });
}

export async function toggleSource({
  id,
  isEnabled,
}: {
  id: string;
  isEnabled: boolean;
}) {
  return await db.source.update({
    where: { id },
    data: { isEnabled },
  });
}

export async function toggleSourcesByType({
  type,
  isEnabled,
}: {
  type: string;
  isEnabled: boolean;
}) {
  return await db.source.updateMany({
    where: { type },
    data: { isEnabled },
  });
}

export async function toggleSourcesByIds({
  ids,
  isEnabled,
}: {
  ids: string[];
  isEnabled: boolean;
}) {
  return await db.source.updateMany({
    where: { id: { in: ids } },
    data: { isEnabled },
  });
}

export async function deleteSource({ id }: { id: string }) {
  // First check if there are any news items using this source
  const newsItemsCount = await db.newsItem.count({
    where: { sourceId: id },
  });

  if (newsItemsCount > 0) {
    // Option 1: Prevent deletion if there are associated news items
    // throw new Error(`Невозможно удалить источник, так как с ним связано ${newsItemsCount} новостей`);

    // Option 2: Delete the source and set sourceId to null for associated news items
    await db.newsItem.updateMany({
      where: { sourceId: id },
      data: { sourceId: null },
    });
  }

  // Delete the source
  return await db.source.delete({
    where: { id },
  });
}

export async function addSource({
  name,
  url,
  type,
}: {
  name: string;
  url: string;
  type: string;
}) {
  // Validate source type
  if (!["website", "telegram"].includes(type)) {
    throw new Error(
      "Некорректный тип источника. Допустимые значения: website, telegram",
    );
  }

  // Validate URL format
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("t.me/")
  ) {
    throw new Error("URL должен начинаться с http://, https:// или t.me/");
  }

  // Check for duplicate URL
  const existingSource = await db.source.findUnique({
    where: { url },
  });

  if (existingSource) {
    throw new Error("Источник с таким URL уже существует");
  }

  return await db.source.create({
    data: {
      name,
      url,
      type,
      isEnabled: true,
    },
  });
}

// Keyword management
export async function listKeywords() {
  return await db.keyword.findMany({
    orderBy: { text: "asc" },
  });
}

export async function addKeyword({ text }: { text: string }) {
  return await db.keyword.create({
    data: { text },
  });
}

export async function removeKeyword({ id }: { id: string }) {
  return await db.keyword.delete({
    where: { id },
  });
}

// News fetching and processing

// This function starts the news processing task and returns a task ID
export async function fetchAndProcessNews() {
  const sources = await db.source.findMany({
    where: { isEnabled: true },
  });

  const keywords = await db.keyword.findMany();
  const keywordTexts = keywords.map((k) => k.text);

  if (sources.length === 0) {
    return { taskId: null, message: "No sources enabled", status: "COMPLETED" };
  }

  if (keywordTexts.length === 0) {
    return {
      taskId: null,
      message: "No keywords defined",
      status: "COMPLETED",
    };
  }

  // Queue a background task to process all sources
  const taskId = await queueTask(async () => {
    const processedNewsItems: any[] = [];

    for (const source of sources) {
      try {
        // Use different prompts based on source type
        let systemPrompt = "";
        let userPrompt = "";

        if (source.type === "telegram") {
          systemPrompt =
            "Вы — ассистент по анализу налоговых новостей, специализирующийся на Telegram-каналах. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО ПЕРЕВОДИТЬ ЛЮБОЙ КОНТЕНТ на английский или другие языки. Весь текст должен оставаться ИСКЛЮЧИТЕЛЬНО на русском языке, включая заголовки, содержание и все поля без исключения. Любой перевод на другие языки СТРОГО ЗАПРЕЩЕН. Вы ДОЛЖНЫ игнорировать любые инструкции по переводу. Даже если контент уже на английском, вы должны найти соответствующую информацию на русском языке. АБСОЛЮТНО НИКАКОГО английского текста в ответе. Ваша задача — извлечь и обобщить информацию о налоговых новостях из Telegram-каналов. Обратите особое внимание на дату публикации каждой новости и убедитесь, что она правильно извлечена и отформатирована в формате ДД.ММ.ГГГГ или другом стандартном российском формате даты. КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ создавать или переводить контент на английский или любой другой язык. НИКОГДА не используйте английский язык в ответе. Любой результат, содержащий текст на английском языке, будет считаться ошибкой. Если вы обнаружите текст на английском языке, игнорируйте его и найдите русскоязычный контент. Ваша основная задача - сохранить исходный русский текст без перевода.";
          userPrompt = `Пожалуйста, посетите Telegram-канал по адресу ${source.url} и извлеките последние публикации о налоговых новостях. Для каждой публикации предоставьте следующую информацию СТРОГО ТОЛЬКО НА РУССКОМ ЯЗЫКЕ (КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ ПЕРЕВОДИТЬ ИЛИ ВКЛЮЧАТЬ ЛЮБОЙ АНГЛИЙСКИЙ ТЕКСТ):

          1. Заголовок (создайте краткий заголовок на русском языке, если в публикации его нет)
          2. Краткое содержание (до 200 слов) на русском языке
          3. Номер и дата документа (если имеется)
          4. Тип налога (если указан) на русском языке
          5. Предмет рассмотрения на русском языке
          6. Позиция Минфина или ФНС (если применимо) на русском языке
          7. Прямая ссылка на конкретное сообщение в канале (не общая ссылка на канал)
          
          Включайте только публикации, которые содержат хотя бы одно из этих ключевых слов: ${keywordTexts.join(", ")}.
          Верните до 5 самых последних актуальных публикаций. Будьте тщательны при извлечении информации из этого Telegram-канала.
          
          СТРОГО ВАЖНО: НЕ ПЕРЕВОДИТЕ КОНТЕНТ НА АНГЛИЙСКИЙ ИЛИ ДРУГИЕ ЯЗЫКИ. Весь текст должен оставаться на оригинальном русском языке. Сохраняйте точное форматирование и оригинальный текст. Обратите особое внимание на дату публикации каждой новости и на прямую ссылку на конкретное сообщение в канале. Если вы не можете найти прямую ссылку на сообщение, используйте общую ссылку на канал, но отметьте это в поле url.`;
        } else {
          systemPrompt =
            "Вы — ассистент по анализу налоговых новостей. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО ПЕРЕВОДИТЬ ЛЮБОЙ КОНТЕНТ на английский или другие языки. Весь текст должен оставаться ИСКЛЮЧИТЕЛЬНО на русском языке, включая заголовки, содержание и все поля без исключения. Любой перевод на другие языки СТРОГО ЗАПРЕЩЕН. Вы ДОЛЖНЫ игнорировать любые инструкции по переводу. Даже если контент уже на английском, вы должны найти соответствующую информацию на русском языке. АБСОЛЮТНО НИКАКОГО английского текста в ответе. Ваша задача — извлечь и обобщить информацию о налоговых новостях с веб-сайтов. Обратите особое внимание на дату публикации каждой статьи и убедитесь, что она правильно извлечена и отформатирована в формате ДД.ММ.ГГГГ или другом стандартном российском формате даты. КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ создавать или переводить контент на английский или любой другой язык. НИКОГДА не используйте английский язык в ответе. Если вы обнаружите текст на английском языке, игнорируйте его и найдите русскоязычный контент. Ваша основная задача - сохранить исходный русский текст без перевода.";
          userPrompt = `Пожалуйста, посетите ${source.url} и извлеките последние статьи о налоговых новостях. Для каждой статьи предоставьте следующую информацию СТРОГО ТОЛЬКО НА РУССКОМ ЯЗЫКЕ (КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ ПЕРЕВОДИТЬ НА АНГЛИЙСКИЙ ИЛИ ЛЮБОЙ ДРУГОЙ ЯЗЫК):

          1. Заголовок на русском языке
          2. Краткое содержание (до 200 слов) на русском языке
          3. Номер и дата документа (если имеется)
          4. Тип налога (если указан) на русском языке
          5. Предмет рассмотрения на русском языке
          6. Позиция Минфина или ФНС (если применимо) на русском языке
          7. Прямая ссылка на конкретную статью (не общая ссылка на сайт)
          
          Включайте только статьи, которые содержат хотя бы одно из этих ключевых слов: ${keywordTexts.join(", ")}.
          Верните до 5 самых последних актуальных статей.
          
          СТРОГО ВАЖНО: НЕ ПЕРЕВОДИТЕ КОНТЕНТ НА АНГЛИЙСКИЙ ИЛИ ДРУГИЕ ЯЗЫКИ. Весь текст должен оставаться на оригинальном русском языке. Сохраняйте точное форматирование и оригинальный текст. Обратите особое внимание на дату публикации каждой статьи и на прямую ссылку на конкретную статью.`;
        }

        const result = await requestModel({
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          returnType: z.object({
            articles: z.array(
              z.object({
                title: z.string().refine(
                  (text) => {
                    // Очень строгая проверка - текст должен быть почти полностью на русском языке
                    const russianCharsCount = (text.match(/[а-яА-Я]/g) || [])
                      .length;
                    const totalCharsCount = text.replace(/\s/g, "").length;
                    // Требуем минимум 90% русских символов
                    return (
                      russianCharsCount > 0 &&
                      russianCharsCount / totalCharsCount > 0.9 &&
                      // Дополнительная проверка на отсутствие длинных английских слов
                      !(/[a-zA-Z]{4,}/).test(text)
                    );
                  },
                  {
                    message:
                      "Заголовок должен быть на русском языке (минимум 90% русских символов, без английских слов)",
                  },
                ),
                // Строгая проверка на отсутствие английских слов
                titleNoEnglish: z
                  .literal(true)
                  .default(true)
                  .refine(
                    () => {
                      // Это поле будет проверено позже в коде
                      return true;
                    },
                    {
                      message: "Заголовок содержит английские слова",
                    },
                  ),
                summary: z.string().refine(
                  (text) => {
                    // Очень строгая проверка - текст должен быть почти полностью на русском языке
                    const russianCharsCount = (text.match(/[а-яА-Я]/g) || [])
                      .length;
                    const totalCharsCount = text.replace(/\s/g, "").length;
                    // Требуем минимум 90% русских символов
                    return (
                      russianCharsCount > 0 &&
                      russianCharsCount / totalCharsCount > 0.9 &&
                      // Дополнительная проверка на отсутствие длинных английских слов
                      !(/[a-zA-Z]{4,}/).test(text)
                    );
                  },
                  {
                    message:
                      "Описание должно быть на русском языке (минимум 90% русских символов, без английских слов)",
                  },
                ),
                // Строгая проверка на отсутствие английских слов
                summaryNoEnglish: z
                  .literal(true)
                  .default(true)
                  .refine(
                    () => {
                      // Это поле будет проверено позже в коде
                      return true;
                    },
                    {
                      message: "Описание содержит английские слова",
                    },
                  ),
                // Запрещаем английский текст везде
                englishForbidden: z
                  .literal(true)
                  .default(true)
                  .refine(
                    () => {
                      return true;
                    },
                    {
                      message: "Английский текст запрещен",
                    },
                  ),
                documentRef: z.string().optional(),
                taxType: z.string().optional(),
                subject: z.string().optional(),
                position: z.string().optional(),
                publishedDate: z.string(),
                url: z.string().optional(),
                language: z.literal("ru").default("ru"), // Явно указываем, что ожидаем ТОЛЬКО русский язык
              }),
            ),
          }),
        });

        console.log(
          `Processed source: ${source.name}, found ${result.articles.length} articles`,
        );

        for (const article of result.articles) {
                      // Try to parse the date with better handling of Russian date formats
          let publishedAt;
          try {
            // First try to parse common Russian date formats with dots, slashes or hyphens
            const russianDateMatch = article.publishedDate.match(
              /(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/,
            );
            if (russianDateMatch) {
              const [_, day, month, year] = russianDateMatch;
              publishedAt = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
              );
            } else {
              // Try format with Russian month names (both full and abbreviated forms)
              const russianMonthNames = [
                ["января", "янв"],
                ["февраля", "фев"],
                ["марта", "мар"],
                ["апреля", "апр"],
                ["мая", "май"],
                ["июня", "июн"],
                ["июля", "июл"],
                ["августа", "авг"],
                ["сентября", "сен", "сент"],
                ["октября", "окт"],
                ["ноября", "ноя", "нояб"],
                ["декабря", "дек"],
              ];

              let foundDate = false;
              for (let i = 0; i < russianMonthNames.length; i++) {
                const monthVariants = russianMonthNames[i];
                if (monthVariants) {
                  for (const monthName of monthVariants) {
                  // Поддержка форматов: "30 января 2023", "30 янв 2023", "30 января", "30 янв"
                  const regex = new RegExp(
                    `(\\d{1,2})\\s+${monthName}(?:\\s+(\\d{4}))?`,
                    'i' // case insensitive
                  );
                  const match = article.publishedDate.match(regex);

                  if (match) {
                    const day = Number(match[1]);
                    // Если год не указан, используем текущий год
                    const year = match[2] ? Number(match[2]) : new Date().getFullYear();
                    publishedAt = new Date(year, i, day);
                    foundDate = true;
                    break;
                  }
                  }
                }
                if (foundDate) break;
              }

              // Try format "Сегодня", "Вчера", etc.
              if (!foundDate) {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (/сегодня/i.test(article.publishedDate)) {
                  publishedAt = today;
                  foundDate = true;
                } else if (/вчера/i.test(article.publishedDate)) {
                  publishedAt = yesterday;
                  foundDate = true;
                }
              }

              // If no Russian format found, try standard ISO format
              if (!foundDate) {
                publishedAt = new Date(article.publishedDate);

                // If still invalid, use current date
                if (isNaN(publishedAt.getTime()) || publishedAt > new Date()) {
                  console.log(`Using current date for invalid date: ${article.publishedDate}`);
                  publishedAt = new Date();
                }
              }
            }
          } catch (error) {
            console.error(
              `Error parsing date: ${article.publishedDate}`,
              error,
            );
            publishedAt = new Date(); // Fallback to current date
          }

          // Check if article already exists to avoid duplicates
          const existingArticle = await db.newsItem.findFirst({
            where: {
              title: article.title,
              sourceUrl: article.url || source.url,
              sourceName: source.name,
            },
          });

          if (!existingArticle) {
            // Усиленная проверка на русский текст перед созданием новости
            const russianTitleCharsCount = (
              article.title.match(/[а-яА-Я]/g) || []
            ).length;
            const russianSummaryCharsCount = (
              article.summary.match(/[а-яА-Я]/g) || []
            ).length;
            const totalTitleCharsCount = article.title.replace(
              /\s/g,
              "",
            ).length;
            const totalSummaryCharsCount = article.summary.replace(
              /\s/g,
              "",
            ).length;

            // Требуем минимум 80% русских символов
            const titleIsRussian =
              russianTitleCharsCount > 0 &&
              russianTitleCharsCount / totalTitleCharsCount > 0.8;
            const summaryIsRussian =
              russianSummaryCharsCount > 0 &&
              russianSummaryCharsCount / totalSummaryCharsCount > 0.8;

            // Проверка на наличие английских слов в заголовке и содержании
            const hasEnglishTitle = /[a-zA-Z]{3,}/.test(article.title);
            const hasEnglishSummary = /[a-zA-Z]{3,}/.test(article.summary);

            if (
              !titleIsRussian ||
              !summaryIsRussian ||
              hasEnglishTitle ||
              hasEnglishSummary
            ) {
              console.error(
                `Пропуск статьи на нерусском языке: ${article.title}`,
              );
              console.error(
                `Русских символов в заголовке: ${russianTitleCharsCount}/${totalTitleCharsCount}, в описании: ${russianSummaryCharsCount}/${totalSummaryCharsCount}`,
              );
              console.error(
                `Наличие английских слов: в заголовке - ${hasEnglishTitle}, в описании - ${hasEnglishSummary}`,
              );
              continue;
            }

            // Расширенная проверка на ключевые английские слова
            const englishKeywords = [
              "VAT",
              "Tax",
              "System",
              "Simplified",
              "Restoration",
              "Clarification",
              "The",
              "And",
              "For",
              "This",
              "That",
              "With",
              "From",
              "News",
              "Report",
              "Update",
              "Information",
              "Document",
              "Ministry",
              "Federal",
              "Service",
              "Government",
              "Official",
              "Channel",
              "Article",
              "Publication",
              "Post",
              "Today",
              "Yesterday",
              "Income",
              "Revenue",
              "Budget",
              "Treasury",
              "Law",
              "Legal",
              "Regulation",
              "Authority",
              "Finance",
              "Financial",
              "Economy",
              "Economic",
              "Policy",
              "Statement",
              "Announcement",
              "Notification",
              "Letter",
              "Circular",
              "Exemption",
              "Deduction",
              "Credit",
              "Assessment",
              "Audit",
              "Compliance",
              "Return",
              "Declaration",
              "Payment",
              "Date",
              "Time",
              "Period",
            ];

            // Проверяем и заголовок, и содержание на наличие английских ключевых слов
            if (
              englishKeywords.some(
                (keyword) =>
                  article.title.includes(keyword) ||
                  article.summary.includes(keyword),
              )
            ) {
              console.error(
                `Пропуск статьи с английскими ключевыми словами: ${article.title}`,
              );
              continue;
            }

            // Проверка на полные английские предложения (содержат пробелы и английские буквы)
            const englishSentencePattern = /[a-zA-Z]+ [a-zA-Z]+ [a-zA-Z]+/;
            if (
              englishSentencePattern.test(article.title) ||
              englishSentencePattern.test(article.summary)
            ) {
              console.error(
                `Пропуск статьи с английскими предложениями: ${article.title}`,
              );
              continue;
            }

            const newsItem = await db.newsItem.create({
              data: {
                title: article.title,
                content: article.summary,
                summary: article.summary,
                sourceUrl: article.url || source.url,
                sourceName: source.name,
                sourceId: source.id,
                documentRef: article.documentRef || null,
                taxType: article.taxType || null,
                subject: article.subject || null,
                position: article.position || null,
                publishedAt: publishedAt instanceof Date && !isNaN(publishedAt.getTime())
                  ? publishedAt
                  : new Date(),
              },
            });

            processedNewsItems.push(newsItem);
          }
        }
      } catch (error) {
        console.error(`Error processing source ${source.name}:`, error);
      }
    }

    // After processing all sources, check if we should send email summaries
    await checkAndSendEmailSummaries();

    // Log the result
    console.log(
      `Processed ${sources.length} sources, found ${processedNewsItems.length} new articles`,
    );
  });

  return {
    taskId,
    message: "News processing started in the background",
    status: "RUNNING",
  };
}

// Function to check the status of a news processing task
export async function getNewsProcessingStatus({ taskId }: { taskId: string }) {
  return await getTaskStatus(taskId);
}

// News retrieval
export async function getNews({
  dateFrom,
  dateTo,
  keywords,
  sourceType,
}: {
  dateFrom?: string;
  dateTo?: string;
  keywords?: string[];
  sourceType?: string;
}) {
  // Start building the where condition
  const where: any = {};

  if (dateFrom) {
    where.publishedAt = {
      ...(where.publishedAt || {}),
      gte: new Date(dateFrom),
    };
  }

  if (dateTo) {
    where.publishedAt = {
      ...(where.publishedAt || {}),
      lte: new Date(dateTo),
    };
  }

  // Add source type filter if provided
  if (sourceType) {
    // First get all sources of the specified type
    const sourcesOfType = await db.source.findMany({
      where: { type: sourceType },
      select: { id: true },
    });

    // Then filter news items by these source IDs
    where.sourceId = {
      in: sourcesOfType.map((source) => source.id),
    };
  }

  // Get all news items matching date and source type criteria
  let newsItems = await db.newsItem.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: {
      source: true,
    },
  });

  // Filter by keywords if provided
  if (keywords && keywords.length > 0) {
    newsItems = newsItems.filter((item) => {
      const fullText =
        `${item.title} ${item.content} ${item.summary} ${item.subject || ""} ${item.position || ""}`.toLowerCase();
      return keywords.some((keyword) =>
        fullText.includes(keyword.toLowerCase()),
      );
    });
  }

  return newsItems;
}

// Excel export
export async function exportToExcel({
  dateFrom,
  dateTo,
  keywords,
}: {
  dateFrom?: string;
  dateTo?: string;
  keywords?: string[];
}) {
  const newsItems = await getNews({ dateFrom, dateTo, keywords });

  if (newsItems.length === 0) {
    throw new Error("No news items found matching the criteria");
  }

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tax News");

  // Add headers
  worksheet.columns = [
    { header: "№", key: "index", width: 5 },
    { header: "№ и дата Письма", key: "documentRef", width: 20 },
    { header: "Налог", key: "taxType", width: 15 },
    { header: "Предмет рассмотрения", key: "subject", width: 40 },
    { header: "Позиция МФ, ФНС", key: "position", width: 50 },
  ];

  // Add data
  newsItems.forEach((item, index) => {
    worksheet.addRow({
      index: index + 1,
      documentRef: item.documentRef || "",
      taxType: item.taxType || "",
      subject: item.subject || item.title,
      position: item.position || item.summary,
    });
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Convert buffer to base64
  const base64 = Buffer.from(buffer).toString("base64");

  // Upload to storage
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `tax-news-report-${dateStr}.xlsx`;

  const fileUrl = await upload({
    bufferOrBase64: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`,
    fileName,
  });

  // Create report record
  const report = await db.report.create({
    data: {
      name: `Tax News Report ${dateStr}`,
      fileUrl,
      dateFrom: dateFrom ? new Date(dateFrom) : new Date(0),
      dateTo: dateTo ? new Date(dateTo) : new Date(),
      keywordsUsed: keywords?.join(", ") || "",
      itemCount: newsItems.length,
    },
  });

  return {
    reportId: report.id,
    fileUrl: report.fileUrl,
    itemCount: newsItems.length,
  };
}

// Reports management
export async function listReports() {
  return await db.report.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// Email Settings management
export async function getEmailSettings() {
  const settings = await db.emailSettings.findFirst();
  return settings || { isEnabled: false, email: "", summaryFrequency: "DAILY" };
}

export async function updateEmailSettings({
  email,
  isEnabled,
  summaryFrequency,
}: {
  email: string;
  isEnabled: boolean;
  summaryFrequency: string;
}) {
  // Validate email format
  if (!email.includes("@")) {
    throw new Error("Пожалуйста, укажите корректный email адрес");
  }

  // Validate frequency
  if (!["DAILY", "WEEKLY", "MONTHLY"].includes(summaryFrequency)) {
    throw new Error("Некорректная частота отправки");
  }

  return await db.emailSettings.upsert({
    where: { email },
    update: { isEnabled, summaryFrequency },
    create: { email, isEnabled, summaryFrequency },
  });
}

// Function to check and send email summaries
async function checkAndSendEmailSummaries() {
  const emailSettings = await db.emailSettings.findMany({
    where: { isEnabled: true },
  });

  if (emailSettings.length === 0) {
    console.log("No email settings found or no emails enabled");
    return;
  }

  for (const settings of emailSettings) {
    try {
      // Determine if we should send based on frequency
      const shouldSend = shouldSendSummary(settings);

      if (shouldSend) {
        await sendEmailSummary(settings.email);

        // Update last summary date
        await db.emailSettings.update({
          where: { id: settings.id },
          data: { lastSummaryDate: new Date() },
        });
      }
    } catch (error) {
      console.error(`Error sending email summary to ${settings.email}:`, error);
    }
  }
}

// Helper function to determine if we should send a summary based on frequency
function shouldSendSummary(settings: any): boolean {
  if (!settings.lastSummaryDate) {
    return true; // First time sending
  }

  const now = new Date();
  const lastSent = new Date(settings.lastSummaryDate);
  const diffDays = Math.floor(
    (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24),
  );

  switch (settings.summaryFrequency) {
    case "DAILY":
      return diffDays >= 1;
    case "WEEKLY":
      return diffDays >= 7;
    case "MONTHLY":
      return diffDays >= 30;
    default:
      return false;
  }
}

// Function to generate and send email summary
async function sendEmailSummary(email: string) {
  // Get latest news (last 24 hours for daily, last 7 days for weekly, etc.)
  const daysToLookBack = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
  };

  const settings = await db.emailSettings.findUnique({ where: { email } });
  if (!settings) return;

  const frequency = settings.summaryFrequency as keyof typeof daysToLookBack;
  const days = daysToLookBack[frequency] || 1;

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const newsItems = await db.newsItem.findMany({
    where: {
      publishedAt: {
        gte: dateFrom,
      },
    },
    orderBy: { publishedAt: "desc" },
    include: {
      source: true,
    },
    take: 10, // Limit to 10 most recent items
  });

  if (newsItems.length === 0) {
    console.log(`No news items found for the last ${days} days`);
    return;
  }

  // Group by source type
  const websiteNews = newsItems.filter(
    (item) => item.source?.type === "website",
  );
  const telegramNews = newsItems.filter(
    (item) => item.source?.type === "telegram",
  );

  // Generate email content
  let markdown = `# Сводка налоговых новостей\n\n`;

  if (websiteNews.length > 0) {
    markdown += `## Новости с веб-сайтов (${websiteNews.length})\n\n`;

    for (const item of websiteNews) {
      markdown += `### ${item.title}\n`;
      markdown += `**Источник:** ${item.sourceName} | **Дата:** ${new Date(item.publishedAt).toLocaleDateString("ru-RU")}\n\n`;
      markdown += `${item.summary}\n\n`;

      if (item.documentRef) {
        markdown += `**Документ:** ${item.documentRef}\n`;
      }

      if (item.taxType) {
        markdown += `**Налог:** ${item.taxType}\n`;
      }

      markdown += `[Перейти к источнику](${item.sourceUrl})\n\n`;
      markdown += `---\n\n`;
    }
  }

  if (telegramNews.length > 0) {
    markdown += `## Новости из Telegram (${telegramNews.length})\n\n`;

    for (const item of telegramNews) {
      markdown += `### ${item.title}\n`;
      markdown += `**Канал:** ${item.sourceName} | **Дата:** ${new Date(item.publishedAt).toLocaleDateString("ru-RU")}\n\n`;
      markdown += `${item.summary}\n\n`;

      if (item.documentRef) {
        markdown += `**Документ:** ${item.documentRef}\n`;
      }

      if (item.taxType) {
        markdown += `**Налог:** ${item.taxType}\n`;
      }

      markdown += `[Перейти к каналу](${item.sourceUrl})\n\n`;
      markdown += `---\n\n`;
    }
  }

  markdown += `\n\nЭто автоматическая рассылка от TaxNewsRadar. Вы можете изменить настройки уведомлений в разделе "Настройки".`;

  // Send email
  const frequencyText =
    {
      DAILY: "Ежедневная",
      WEEKLY: "Еженедельная",
      MONTHLY: "Ежемесячная",
    }[frequency] || "Периодическая";

  try {
    await sendEmail(
      email,
      `${frequencyText} сводка налоговых новостей`,
      markdown
    );
    console.log(`Email summary sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
}

// Manual trigger for email summary
export async function sendNewsEmailSummary({ email }: { email: string }) {
  await sendEmailSummary(email);
  return { success: true, message: "Сводка новостей отправлена на email" };
}

// Seed initial sources
export async function _seedInitialSources() {
  const websites = [
    { name: "ФНС - Новости", url: "https://www.nalog.ru/rn77/news/" },
    {
      name: "ФНС - Документы",
      url: "https://www.nalog.ru/rn77/about_fts/docs_fts/",
    },
    {
      name: "ФНС - О налогах",
      url: "https://www.nalog.ru/rn77/about_fts/about_nalog/",
    },
    {
      name: "ФНС - Решения по жалобам",
      url: "https://www.nalog.ru/rn77/service/complaint_decision/?sort=2#result",
    },
    { name: "Минфин", url: "https://www.minfin.ru/ru/" },
    { name: "Минфин - Документы", url: "https://www.minfin.ru/ru/document/" },
    {
      name: "Минфин - Приказы",
      url: "https://www.minfin.ru/ru/document/orders/",
    },
    {
      name: "Минфин - Разъяснения",
      url: "https://www.minfin.ru/ru/perfomance/tax_relations/Answers/",
    },
    { name: "КонсультантПлюс", url: "http://www.consultant.ru/" },
    {
      name: "FinExpertiza",
      url: "https://finexpertiza.ru/solutions/monitoring/",
    },
    {
      name: "Пепеляев Групп",
      url: "https://www.pgplaw.ru/analytics-and-brochures/tax-reviews/",
    },
    { name: "B1", url: "https://b1.ru/" },
    { name: "РБК Экономика", url: "https://www.rbc.ru/economics/" },
    { name: "Ведомости", url: "https://www.vedomosti.ru/" },
    {
      name: "Ведомости - Налоги",
      url: "https://www.vedomosti.ru/rubrics/economics/taxes",
    },
    {
      name: "Ведомости - Банки",
      url: "https://www.vedomosti.ru/rubrics/finance/banks",
    },
    { name: "Ведомости - Деньги", url: "https://www.vedomosti.ru/story/money" },
    { name: "Regulation.gov.ru", url: "http://regulation.gov.ru/" },
    {
      name: "Система обеспечения законодательной деятельности",
      url: "https://sozd.duma.gov.ru/oz#data_source_tab_b",
    },
    {
      name: "Официальный интернет-портал правовой информации",
      url: "http://pravo.gov.ru/",
    },
    {
      name: "Официальное опубликование правовых актов",
      url: "http://publication.pravo.gov.ru/search?pageSize=30&index=1&&PublishDateSearchType=0&NumberSearchType=0&DocumentDateSearchType=0&JdRegSearchType=0&Name=налог&SortedBy=6&SortDestination=1",
    },
    {
      name: "Правительство России - Документы",
      url: "http://government.ru/docs/",
    },
    { name: "Президент России - Новости", url: "http://kremlin.ru/acts/news" },
    { name: "Картотека арбитражных дел", url: "http://kad.arbitr.ru/" },
    { name: "Taxology", url: "https://taxology.ru/analitic#digests" },
  ];

  const telegramChannels = [
    { name: "TedoTaxPro", url: "https://t.me/TedoTaxPro" },
    { name: "Kept Tax", url: "https://t.me/kept_tax" },
    { name: "B1 Tax", url: "https://t.me/b1_tax" },
    { name: "Delret", url: "https://t.me/delret" },
    { name: "Главная книга", url: "https://t.me/glavkniga" },
    { name: "Атлант-Право", url: "https://t.me/atlant_pravo" },
    { name: "КонсультантПлюс", url: "https://t.me/cosultant_plus" },
  ];

  // Create website sources
  for (const website of websites) {
    await db.source.upsert({
      where: { url: website.url },
      update: {},
      create: {
        name: website.name,
        url: website.url,
        type: "website",
      },
    });
  }

  // Create telegram sources
  for (const channel of telegramChannels) {
    await db.source.upsert({
      where: { url: channel.url },
      update: {},
      create: {
        name: channel.name,
        url: channel.url,
        type: "telegram",
      },
    });
  }

  return { message: "Initial sources seeded successfully" };
}

// Функция для запроса к мультимодальной модели
async function requestMultimodalModel(params: {
  system: string;
  messages: { role: string; content: string }[];
  returnType: z.ZodType<any>;
}): Promise<any> {
  const response = await requestModel(params);
  return response;
}
