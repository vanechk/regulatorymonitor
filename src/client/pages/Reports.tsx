import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, type Report } from '../../client/api';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, Skeleton } from '../../components/ui';
import { Separator } from '../../components/ui/separator';
import { FileSpreadsheet, Calendar, FileText, Download, Search } from 'lucide-react';

function Reports() {
  // Fetch reports
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: apiClient.listReports,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Отчеты</h1>
        <p className="text-muted-foreground">История сгенерированных отчетов</p>
      </div>

      <Separator />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Нет отчетов</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Сгенерируйте отчет на странице Дашборд
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.name}</CardTitle>
                <CardDescription>
                  Создан: {new Date(report.createdAt).toLocaleString("ru-RU")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Период:{" "}
                      {new Date(report.dateFrom).toLocaleDateString("ru-RU")} -{" "}
                      {new Date(report.dateTo).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Количество записей: {report.itemCount}
                    </span>
                  </div>
                  {report.keywordsUsed && (
                    <div className="flex items-center">
                      <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Ключевые слова: {report.keywordsUsed}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => window.open(report.fileUrl, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать Excel
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reports; 