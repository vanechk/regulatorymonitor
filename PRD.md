# Product Requirements Document for TaxNewsRadar

## App Overview
- Name: TaxNewsRadar
- Tagline: Automated tax news monitoring and reporting for Russian tax professionals and individuals
- Category: web_application
- Visual Style: Modern Monochrome (e.g. Linear)

## Workflow

1. User configures news sources and keywords in the Settings page
2. System automatically scrapes the selected sources on a regular schedule
3. Content is filtered by keywords and summarized
4. User views filtered news on the Dashboard with summaries
5. User can further filter by date range or additional keywords
6. User exports results to Excel in the required format (№, № и дата Письма, Налог, Предмет рассмотрения, Позиция МФ, ФНС)
7. System saves the report for future reference in the Reports section

## Application Structure


### Route: /

Dashboard page displaying the latest parsed news with summaries. Features a sidebar with source selection checkboxes, a keyword input field with tags, and a date range selector. Each news item shows the source, date, title, and summary. A prominent 'Export to Excel' button is available at the top.


### Route: /settings

Settings page where users can manage their news sources (enable/disable from the predefined list), add/remove keywords for filtering, and configure parsing frequency. The page includes separate sections for website sources and Telegram channels with toggle switches for each source.


### Route: /reports

Reports history page showing previously generated Excel reports with download links, generation dates, and filter criteria used. Each report entry shows the date range covered, number of news items included, and keywords used for filtering.


## Potentially Relevant Utility Functions

### requestMultimodalModel

Potential usage: Used to analyze and summarize news content from the parsed sources

Look at the documentation for this utility function and determine whether or not it is relevant to the app's requirements.


----------------------------------

### upload

Potential usage: Used to upload the generated Excel reports for user download

Look at the documentation for this utility function and determine whether or not it is relevant to the app's requirements.

## External APIs
- OpenAI API
  - Usage: Used for summarizing news content and extracting key information from articles
- exceljs
  - Usage: Used for generating Excel reports in the required format

## Resources
- List of news sources (other): https://www.nalog.ru/rn77/news/
- Excel report format (other): https://example.com/excel-format