import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Report } from '../api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Skeleton } from '../../components/ui/skeleton';
import { FileSpreadsheet, Calendar, FileText, Download, Search, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Reports: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: apiClient.listReports,
  });

  // Mutation для удаления отчета
  const deleteReportMutation = useMutation({
    mutationFn: apiClient.deleteReport,
    onSuccess: (data) => {
      toast({
        title: "Отчет удален",
        description: data.message,
      });
      // Обновляем список отчетов
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setDeletingReportId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
      setDeletingReportId(null);
    },
  });

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот отчет? Это действие нельзя отменить.')) {
      setDeletingReportId(reportId);
      deleteReportMutation.mutate(reportId);
    }
  };

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
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => window.open(report.fileUrl, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать Excel
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteReport(report.id)}
                  disabled={deletingReportId === report.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingReportId === report.id ? 'Удаление...' : 'Удалить'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports; 