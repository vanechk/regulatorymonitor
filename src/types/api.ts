export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string | null;
  sourceUrl: string;
  sourceName: string;
  publishedAt: string;
  documentRef?: string | null;
  taxType?: string | null;
  subject?: string | null;
  position?: string | null;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: "website" | "telegram";
  isEnabled: boolean;
}

export interface Keyword {
  id: string;
  text: string;
}

export interface Report {
  id: string;
  name: string;
  createdAt: string;
  dateFrom: string;
  dateTo: string;
  itemCount: number;
  fileUrl: string;
  keywordsUsed?: string;
}

export interface EmailSettings {
  email: string;
  isEnabled: boolean;
  summaryFrequency: "DAILY" | "WEEKLY" | "MONTHLY";
}