import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { apiClient } from '../api';

interface EmailSenderProps {
  selectedNewsIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const EmailSender: React.FC<EmailSenderProps> = ({
  selectedNewsIds,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(`Мониторинг налогового законодательства - ${new Date().toLocaleDateString('ru-RU')}`);
  const [message, setMessage] = useState('Направляем подборку актуальных новостей по налоговому законодательству:');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Пожалуйста, введите корректный email адрес');
      return;
    }

    if (selectedNewsIds.length === 0) {
      setError('Не выбрано ни одной новости для отправки');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.sendSelectedNewsEmail({
        email,
        newsIds: selectedNewsIds,
        subject,
        message,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при отправке email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Отправка новостей по email</CardTitle>
          <div className="text-sm text-muted-foreground">
            Выбрано для отправки: <Badge variant="secondary">{selectedNewsIds.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email адрес получателя *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="example@vtb.ru"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Тема письма</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                placeholder="Введите тему письма"
              />
            </div>

            <div>
              <Label htmlFor="message">Текст сопроводительного письма</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                placeholder="Введите текст сопроводительного письма..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Отменить
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 