import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const sources = [
  { name: 'ФНС Новости', url: 'https://www.nalog.ru/rn77/news/', type: 'website' },
  { name: 'ФНС Документы', url: 'https://www.nalog.ru/rn77/about_fts/docs_fts/', type: 'website' },
  { name: 'ФНС О налоге', url: 'https://www.nalog.ru/rn77/about_fts/about_nalog/', type: 'website' },
  { name: 'ФНС Жалобы', url: 'https://www.nalog.ru/rn77/service/complaint_decision/?sort=2#result', type: 'website' },
  { name: 'Минфин РФ', url: 'https://www.minfin.ru/ru/', type: 'website' },
  { name: 'Минфин Документы', url: 'https://www.minfin.ru/ru/document/', type: 'website' },
  { name: 'Минфин Приказы', url: 'https://www.minfin.ru/ru/document/orders/', type: 'website' },
  { name: 'Минфин Вопросы по налогам', url: 'https://www.minfin.ru/ru/perfomance/tax_relations/Answers/', type: 'website' },
  { name: 'КонсультантПлюс', url: 'http://www.consultant.ru/', type: 'website' },
  { name: 'Finexpertiza Мониторинг', url: 'https://finexpertiza.ru/solutions/monitoring/', type: 'website' },
  { name: 'PGP Law Налоговые обзоры', url: 'https://www.pgplaw.ru/analytics-and-brochures/tax-reviews/', type: 'website' },
  { name: 'B1 Групп', url: 'https://b1.ru/', type: 'website' },
  { name: 'РБК Экономика', url: 'https://www.rbc.ru/economics/', type: 'website' },
  { name: 'Ведомости', url: 'https://www.vedomosti.ru/', type: 'website' },
  { name: 'Ведомости Налоги', url: 'https://www.vedomosti.ru/rubrics/economics/taxes', type: 'website' },
  { name: 'Ведомости Банки', url: 'https://www.vedomosti.ru/rubrics/finance/banks', type: 'website' },
  { name: 'Ведомости Деньги', url: 'https://www.vedomosti.ru/story/money', type: 'website' },
  { name: 'Regulation.gov.ru', url: 'http://regulation.gov.ru/', type: 'website' },
  { name: 'SOZD Госдума', url: 'https://sozd.duma.gov.ru/oz#data_source_tab_b', type: 'website' },
  { name: 'Pravo.gov.ru', url: 'http://pravo.gov.ru/', type: 'website' },
  { name: 'Publication Pravo Президент', url: 'http://publication.pravo.gov.ru/Calendar?code=president', type: 'website' },
  { name: 'Правительство РФ Документы', url: 'http://government.ru/docs/', type: 'website' },
  { name: 'Кремль Новости', url: 'http://kremlin.ru/acts/news', type: 'website' },
  { name: 'КАД Арбитраж', url: 'http://kad.arbitr.ru/', type: 'website' },
  { name: 'TedoTaxPro', url: 'https://t.me/TedoTaxPro', type: 'telegram' },
  { name: 'kept_tax', url: 'https://t.me/kept_tax', type: 'telegram' },
  { name: 'b1_tax', url: 'https://t.me/b1_tax', type: 'telegram' },
  { name: 'Федеральная налоговая служба России', url: 'http://www.nalog.ru/', type: 'website' },
  // Новые Telegram-каналы
  { name: 'РГРУ Новости', url: 'https://t.me/rgrunews', type: 'telegram' },
  { name: 'Forbes Россия', url: 'https://t.me/forbesrussia', type: 'telegram' },
  { name: 'РИА Новости', url: 'https://t.me/rian_ru', type: 'telegram' },
  { name: 'РСПП Новости', url: 'https://t.me/rsppnews', type: 'telegram' },
  { name: 'Парламентские новости', url: 'https://t.me/parlament_novosti', type: 'telegram' },
  { name: 'Публикация правовых актов', url: 'https://t.me/LegalActsPublication', type: 'telegram' },
  { name: 'Главная книга', url: 'https://t.me/glavkniga', type: 'telegram' },
  { name: 'Гарант Новости', url: 'https://t.me/garantnews', type: 'telegram' },
  { name: 'Бухгалтерия.ру', url: 'https://t.me/bbuhgalteriaru', type: 'telegram' },
  { name: 'Минфин Telegram', url: 'https://t.me/minfin', type: 'telegram' },
  { name: 'Атлант Право', url: 'https://t.me/atlant_pravo', type: 'telegram' },
  { name: 'Законопроекты', url: 'https://t.me/zakonoproekty', type: 'telegram' },
  { name: 'Налог.гов.ру', url: 'https://t.me/nalog_gov_ru', type: 'telegram' },
  { name: 'Госдума РФ', url: 'https://t.me/duma_gov_ru', type: 'telegram' },
  { name: 'КонсультантПлюс Telegram', url: 'https://t.me/consultant_plus', type: 'telegram' },
  { name: 'НФА Новости', url: 'https://t.me/nfanews', type: 'telegram' },
  { name: 'Мытарь РФ', url: 'https://t.me/mytar_rf', type: 'telegram' },
  { name: 'DD Tax', url: 'https://t.me/DD_tax', type: 'telegram' },
  { name: 'Науфор Telegram', url: 'https://t.me/naufortelegram', type: 'telegram' },
];

const keywords = [
  'НДС',
  'налог на прибыль',
  'налог на доходы физических лиц',
  'НДФЛ',
  'страховые взносы',
  'налоговая декларация',
  'налоговая проверка',
  'налоговые льготы',
  'налоговый вычет',
  'налоговая оптимизация',
  'налоговое планирование',
  'налоговая отчетность',
  'налоговый кодекс',
  'налоговая политика',
  'налоговые изменения',
  'налоговые новости',
  'ФНС',
  'Минфин',
  'налоговая служба',
  'налоговое законодательство',
];

async function main() {
  console.log('Начинаю добавление источников и ключевых слов...');
  
  // Очищаем существующие данные
  await prisma.newsItem.deleteMany({});
  await prisma.source.deleteMany({});
  await prisma.keyword.deleteMany({});
  console.log('Все существующие данные удалены');
  
  // Добавляем ключевые слова
  for (const keyword of keywords) {
    await prisma.keyword.create({
      data: { text: keyword }
    });
    console.log(`Добавлено ключевое слово: ${keyword}`);
  }
  
  // Добавляем источники
  for (const source of sources) {
    await prisma.source.create({
      data: {
        name: source.name,
        url: source.url,
        type: source.type,
        isEnabled: true
      }
    });
    console.log(`Добавлен источник: ${source.name}`);
  }
  
  console.log(`Всего добавлено ${sources.length} источников и ${keywords.length} ключевых слов`);

  // === Добавляем тестовые новости за период 10.06.2025 - 29.06.2025 ===
  const allSources = await prisma.source.findMany();
  const allKeywords = await prisma.keyword.findMany();
  const startDate = new Date('2025-06-10');
  const endDate = new Date('2025-06-29');
  let currentDate = new Date(startDate);
  let newsCount = 0;
  while (currentDate <= endDate) {
    const source = allSources[newsCount % allSources.length];
    const keyword = allKeywords[newsCount % allKeywords.length];
    await prisma.newsItem.create({
      data: {
        title: `Тестовая новость №${newsCount + 1} за ${currentDate.toLocaleDateString('ru-RU')}`,
        summary: `Это тестовая новость для проверки фильтрации и отображения. Ключевое слово: ${keyword.text}`,
        publishedAt: new Date(currentDate),
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        keywords: {
          connect: [{ id: keyword.id }]
        }
      }
    });
    newsCount++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  console.log(`Добавлено тестовых новостей: ${newsCount}`);

  // === Добавляем тестовые новости за прошлую неделю ===
  const today = new Date();
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - today.getDay() + 1 - 7); // понедельник прошлой недели
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6); // воскресенье прошлой недели
  let currentTestDate = new Date(lastMonday);
  let testNewsCount = 0;
  while (currentTestDate <= lastSunday) {
    const source = allSources[testNewsCount % allSources.length];
    const keyword = allKeywords[testNewsCount % allKeywords.length];
    await prisma.newsItem.create({
      data: {
        title: `Тестовая новость (прошлая неделя) №${testNewsCount + 1} за ${currentTestDate.toLocaleDateString('ru-RU')}`,
        summary: `Это тестовая новость за прошлую неделю. Ключевое слово: ${keyword.text}`,
        publishedAt: new Date(currentTestDate),
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        keywords: {
          connect: [{ id: keyword.id }]
        }
      }
    });
    testNewsCount++;
    currentTestDate.setDate(currentTestDate.getDate() + 1);
  }
  console.log(`Добавлено тестовых новостей за прошлую неделю: ${testNewsCount}`);

  // === Добавляем новые данные ===
  // Создаем новые данные
  const news = [
    {
      title: 'Изменения в порядке уплаты НДС с 2025 года',
      summary: 'Министерство финансов опубликовало проект изменений в порядке уплаты НДС. Основные изменения коснутся порядка оформления счетов-фактур и сроков уплаты налога.',
      sourceUrl: 'https://minfin.gov.ru/ru/press-center/',
      sourceName: 'Министерство финансов РФ',
      publishedAt: new Date('2024-03-15'),
      documentRef: 'Проект Федерального закона № 123456-8',
      taxType: 'НДС',
      subject: 'Изменение порядка уплаты НДС',
      position: 'Планируется изменить сроки уплаты НДС и порядок оформления документов',
      sourceId: allSources.find(s => s.name === 'Министерство финансов РФ')?.id,
    },
    {
      title: 'Новые разъяснения ФНС по налогу на прибыль',
      summary: 'ФНС выпустила письмо с разъяснениями по вопросам учета расходов при расчете налога на прибыль организаций.',
      sourceUrl: 'https://www.nalog.gov.ru/rn77/news/',
      sourceName: 'Федеральная налоговая служба',
      publishedAt: new Date('2024-03-14'),
      documentRef: 'Письмо ФНС России от 14.03.2024 № БС-4-11/2345@',
      taxType: 'Налог на прибыль',
      subject: 'Разъяснения по учету расходов',
      position: 'Даны разъяснения по порядку учета расходов при расчете налога на прибыль',
      sourceId: allSources.find(s => s.name === 'Федеральная налоговая служба')?.id,
    },
    {
      title: 'Обзор практики по НДФЛ за I квартал 2024',
      summary: 'Консультант Плюс подготовил обзор судебной практики по вопросам исчисления и уплаты НДФЛ за первый квартал 2024 года.',
      sourceUrl: 'http://www.consultant.ru/law/review/',
      sourceName: 'Консультант Плюс',
      publishedAt: new Date('2024-03-13'),
      documentRef: 'Обзор практики от 13.03.2024',
      taxType: 'НДФЛ',
      subject: 'Обзор судебной практики',
      position: 'Представлен анализ ключевых судебных решений по НДФЛ',
      sourceId: allSources.find(s => s.name === 'Консультант Плюс')?.id,
    },
  ];

  // Добавляем новости
  for (const newsItem of news) {
    const created = await prisma.newsItem.create({
      data: {
        ...newsItem,
        keywords: {
          connect: allKeywords
            .filter(k => newsItem.title.toLowerCase().includes(k.text.toLowerCase()) || 
                        newsItem.summary.toLowerCase().includes(k.text.toLowerCase()))
            .map(k => ({ id: k.id }))
        }
      }
    });
    console.log(`Created news item: ${created.title}`);
  }

  console.log('База данных успешно заполнена тестовыми данными');
}

main()
  .catch(e => {
    console.error('Ошибка при добавлении данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });