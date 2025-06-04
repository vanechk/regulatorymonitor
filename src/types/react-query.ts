import { Source, Keyword, NewsItem, Report, EmailSettings } from "../client/api";

export type QueryKeys = {
  news: {
    queryKey: ["news"];
    data: NewsItem[];
  };
  keywords: {
    queryKey: ["keywords"];
    data: Keyword[];
  };
  sources: {
    queryKey: ["sources"];
    data: Source[];
  };
  emailSettings: {
    queryKey: ["emailSettings"];
    data: EmailSettings;
  };
  reports: {
    queryKey: ["reports"];
    data: Report[];
  };
  processingStatus: {
    queryKey: ["processingStatus", string];
    data: { status: string; progress: number };
  };
};

export type MutationKeys = {
  fetchNews: {
    variables: void;
    data: { taskId: string | null; message: string; status: string };
  };
  exportToExcel: {
    variables: { dateFrom?: string; dateTo?: string; keywords?: string[] };
    data: { reportId: string; fileUrl: string; itemCount: number };
  };
  toggleSource: {
    variables: { id: string; isEnabled: boolean };
    data: Source;
  };
  toggleSourcesByType: {
    variables: { type: string; isEnabled: boolean };
    data: void;
  };
  toggleSourcesByIds: {
    variables: { ids: string[]; isEnabled: boolean };
    data: void;
  };
  deleteSource: {
    variables: { id: string };
    data: void;
  };
  addSource: {
    variables: { name: string; url: string; type: string };
    data: Source;
  };
  updateEmailSettings: {
    variables: { email: string; isEnabled: boolean; summaryFrequency: string };
    data: EmailSettings;
  };
  sendTestEmail: {
    variables: { email: string };
    data: { success: boolean; message: string };
  };
  addKeyword: {
    variables: { text: string };
    data: Keyword;
  };
  removeKeyword: {
    variables: { id: string };
    data: void;
  };
}; 