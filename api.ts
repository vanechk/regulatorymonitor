import { db } from './src/server/db';
import { type NewsItem, type Source, type Keyword, type Report, type EmailSettings } from '~/types/api';
import { queueTask, getTaskStatus, sendEmail, upload, requestMultimodalModel as requestModel } from './src/server/actions';
import { getParserForSource } from './src/parsers';
import { z } from 'zod';
import * as ExcelJS from "exceljs";
// import VTBLogo from '../../assets/vtb-logo.svg'; // This will be used in UI components, not here.

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
  const existingSource = await db.source.findFirst({
    where: {
      url: url
    },
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
export async function fetchAndProcessNews(params?: {
  sourceType?: string;
  keywords?: string[];
}) {
  // Build where condition for sources based on filters
  const sourceWhere: any = { isEnabled: true };
  
  if (params?.sourceType) {
    sourceWhere.type = params.sourceType;
  }

  const sources = await db.source.findMany({
    where: sourceWhere,
  });

  const keywords = await db.keyword.findMany();
  const keywordTexts = params?.keywords || keywords.map((k) => k.text);

  if (sources.length === 0) {
    return { taskId: null, message: "No sources enabled", status: "COMPLETED" };
  }

  // Queue a background task to process all sources
  const taskId = await queueTask(async () => {
    const processedNewsItems: any[] = [];

    for (const source of sources) {
      try {
        console.log(`Processing source: ${source.name} (${source.url})`);
        
        const parser = getParserForSource(source);
        const parseResult = await parser(source.url, keywordTexts);
        
        if (parseResult.error) {
          console.error(`Error parsing source ${source.name}:`, parseResult.error);
          continue;
        }

        console.log(
          `Processed source: ${source.name}, found ${parseResult.articles.length} articles`,
        );

        for (const article of parseResult.articles) {
          // Date parsing is now handled inside each parser, returning an ISO string.
          // We just need to convert it to a Date object.
          let publishedAt: Date;
          try {
                publishedAt = new Date(article.publishedDate);
            if (isNaN(publishedAt.getTime())) {
              console.log(`Using current date for invalid date string: ${article.publishedDate}`);
                  publishedAt = new Date();
            }
          } catch (error) {
            console.error(
              `Error constructing date from string: ${article.publishedDate}`,
              error,
            );
            publishedAt = new Date(); // Fallback to current date
          }

          // Check if article already exists to avoid duplicates
          const existingArticle = await db.newsItem.findFirst({
            where: {
              OR: [
                { title: article.title, sourceName: source.name },
                { sourceUrl: article.url, sourceName: source.name },
              ]
            },
          });

          if (!existingArticle) {
            // Truncate summary to prevent DB errors
            const summary = article.summary.length > 500
              ? article.summary.substring(0, 497) + '...'
              : article.summary;

            const newsItem = await db.newsItem.create({
              data: {
                title: article.title,
                summary: summary,
                sourceUrl: article.url || source.url,
                sourceName: source.name,
                sourceId: source.id,
                documentRef: article.documentRef || null,
                taxType: article.taxType || null,
                subject: article.subject || null,
                position: article.position || null,
                publishedAt,
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
  try {
  // Start building the where condition
  const where: any = {};

    // Handle date filters carefully
  if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!isNaN(fromDate.getTime())) {
    where.publishedAt = {
      ...(where.publishedAt || {}),
          gte: fromDate,
    };
      } else {
        console.warn('Invalid dateFrom:', dateFrom);
      }
  }

  if (dateTo) {
      const toDate = new Date(dateTo);
      if (!isNaN(toDate.getTime())) {
    where.publishedAt = {
      ...(where.publishedAt || {}),
          lte: toDate,
    };
      } else {
        console.warn('Invalid dateTo:', dateTo);
      }
  }

    console.log('Date filters:', { dateFrom, dateTo, where });

  // Add source type filter if provided
  if (sourceType) {
    // First get all sources of the specified type
    const sourcesOfType = await db.source.findMany({
      where: { type: sourceType },
      select: { id: true },
    });

      console.log('Sources of type:', sourceType, sourcesOfType);

      if (sourcesOfType.length > 0) {
    // Then filter news items by these source IDs
    where.sourceId = {
      in: sourcesOfType.map((source) => source.id),
    };
      } else {
        console.warn('No sources found for type:', sourceType);
      }
  }

    console.log('Final where clause:', where);

  // Get all news items matching date and source type criteria
  let newsItems = await db.newsItem.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    include: {
      source: true,
    },
  });

    console.log('Found news items before keyword filtering:', newsItems.length);

  // Filter by keywords if provided
    if (keywords && keywords.length > 0 && keywords[0] !== '') {
      console.log('Filtering by keywords:', keywords);
    newsItems = newsItems.filter((item) => {
      const fullText =
          `${item.title} ${item.summary} ${item.subject || ""} ${item.position || ""}`.toLowerCase();
      return keywords.some((keyword) =>
          fullText.includes(keyword.toLowerCase().trim()),
      );
    });
      console.log('News items after keyword filtering:', newsItems.length);
  }

  return newsItems;
  } catch (error) {
    console.error('Error in getNews:', error);
    throw error;
  }
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
      // For now, let's assume we send the summary regardless of frequency for simplicity.
      // A proper implementation would check the last sent date.
        await sendEmailSummary(settings.email);
    } catch (error) {
      console.error(`Error sending email summary to ${settings.email}:`, error);
    }
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

// Function to send selected news items via email
export async function sendSelectedNewsEmail({
  email,
  newsIds,
  subject,
  message,
}: {
  email: string;
  newsIds: string[];
  subject?: string;
  message?: string;
}) {
  // Validate email format
  if (!email.includes("@")) {
    throw new Error("Пожалуйста, укажите корректный email адрес");
  }

  // Get the selected news items
  const newsItems = await db.newsItem.findMany({
    where: { id: { in: newsIds } },
    include: { source: true },
    orderBy: { publishedAt: "desc" },
  });

  if (newsItems.length === 0) {
    throw new Error("Не выбрано ни одной новости для отправки");
  }

  // Generate email content
  const emailSubject = subject || `Новости по налогообложению - ${new Date().toLocaleDateString('ru-RU')}`;
  const emailMessage = message || "Вот выбранные вами новости по налогообложению:";

  // Create HTML content
  let htmlContent = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .news-item { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .news-title { font-size: 18px; font-weight: bold; color: #2c5aa0; margin-bottom: 10px; }
        .news-summary { margin-bottom: 10px; }
        .news-meta { font-size: 12px; color: #666; }
        .news-source { color: #888; }
        .news-date { color: #888; }
        .header { background-color: #f5f5f5; padding: 20px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Новости по налогообложению</h1>
        <p>${emailMessage}</p>
        <p><strong>Дата отправки:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
      </div>
  `;

  newsItems.forEach((item, index) => {
    htmlContent += `
      <div class="news-item">
        <div class="news-title">${index + 1}. ${item.title}</div>
        <div class="news-summary">${item.summary}</div>
        <div class="news-meta">
          <div class="news-source"><strong>Источник:</strong> ${item.sourceName}</div>
          <div class="news-date"><strong>Дата публикации:</strong> ${item.publishedAt.toLocaleDateString('ru-RU')}</div>
          ${item.documentRef ? `<div><strong>Документ:</strong> ${item.documentRef}</div>` : ''}
          ${item.taxType ? `<div><strong>Тип налога:</strong> ${item.taxType}</div>` : ''}
          ${item.subject ? `<div><strong>Предмет:</strong> ${item.subject}</div>` : ''}
        </div>
        ${item.sourceUrl ? `<div style="margin-top: 10px;"><a href="${item.sourceUrl}" target="_blank">Читать оригинал</a></div>` : ''}
      </div>
    `;
  });

  htmlContent += `
      <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
        <p><em>Это автоматическое сообщение от системы мониторинга налоговых новостей.</em></p>
      </div>
    </body>
    </html>
  `;

  // Send email using the existing email functionality
  try {
    await sendEmail(email, emailSubject, htmlContent);

    return {
      success: true,
      message: `Новости успешно отправлены на ${email}`,
      sentCount: newsItems.length,
    };
  } catch (error) {
    console.error('Error sending selected news email:', error);
    throw new Error('Ошибка при отправке email');
  }
}
