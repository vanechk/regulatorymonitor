import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ProductionCalendar } from '../../components/ui/production-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Calendar as CalendarIcon, Info, AlertCircle } from 'lucide-react';
import { 
  getYear2025Info, 
  getHolidaysInPeriod, 
  getWorkingDaysInPeriod,
  type CalendarDay 
} from '../../lib/calendar';

function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const yearInfo = getYear2025Info();

  // Получаем все праздники на 2025 год
  const allHolidays = getHolidaysInPeriod(
    new Date(2025, 0, 1),
    new Date(2025, 11, 31)
  );

  // Получаем рабочие дни для выбранного периода (например, первый квартал)
  const q1WorkingDays = getWorkingDaysInPeriod(
    new Date(2025, 0, 1),
    new Date(2025, 2, 31)
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getSelectedDateInfo = () => {
    if (!selectedDate) return null;

    const dateStr = format(selectedDate, 'dd.MM.yyyy');
    const dayOfWeek = format(selectedDate, 'EEEE', { locale: ru });
    
    // Проверяем тип дня
    const isWorking = getWorkingDaysInPeriod(selectedDate, selectedDate).length > 0;
    const holidays = getHolidaysInPeriod(selectedDate, selectedDate);
    const isHoliday = holidays.length > 0;

    return {
      dateStr,
      dayOfWeek,
      isWorking,
      isHoliday,
      holidayName: isHoliday ? holidays[0].holidayName : undefined,
    };
  };

  const selectedDateInfo = getSelectedDateInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Производственный календарь</h1>
        <p className="text-muted-foreground">
          Календарь рабочих дней, праздников и переносов на 2025 год
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основной календарь */}
        <div className="lg:col-span-2">
          <ProductionCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            showYearInfo={false}
          />
        </div>

        {/* Боковая панель с информацией */}
        <div className="space-y-4">
          {/* Информация о выбранной дате */}
          {selectedDateInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {selectedDateInfo.dateStr}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">День недели:</span>
                  <p className="font-medium">{selectedDateInfo.dayOfWeek}</p>
                </div>
                
                <div>
                  <span className="text-sm text-muted-foreground">Тип дня:</span>
                  <div className="mt-1">
                    {selectedDateInfo.isHoliday ? (
                      <Badge variant="destructive" className="text-xs">
                        Праздничный день
                      </Badge>
                    ) : selectedDateInfo.isWorking ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Рабочий день
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Выходной день
                      </Badge>
                    )}
                  </div>
                </div>

                {selectedDateInfo.holidayName && (
                  <div>
                    <span className="text-sm text-muted-foreground">Праздник:</span>
                    <p className="font-medium text-red-700">{selectedDateInfo.holidayName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Статистика года */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Статистика {yearInfo.year}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Всего дней:</span>
                  <p className="font-medium">{yearInfo.totalDays}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Рабочих дней:</span>
                  <p className="font-medium text-green-700">{yearInfo.workingDays}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Праздников:</span>
                  <p className="font-medium text-red-700">{yearInfo.holidays}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Выходных:</span>
                  <p className="font-medium text-gray-700">{yearInfo.weekends}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Переносы рабочих дней */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Переносы рабочих дней
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>3 января (пт)</span>
                  <span className="text-blue-600">→ 10 мая (сб)</span>
                </div>
                <div className="flex justify-between">
                  <span>6 января (пн)</span>
                  <span className="text-blue-600">→ 12 мая (пн)</span>
                </div>
                <div className="flex justify-between">
                  <span>8 января (ср)</span>
                  <span className="text-blue-600">→ 13 мая (вт)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Праздники по месяцам */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Праздники по месяцам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthHolidays = allHolidays.filter(
                    holiday => holiday.date.getMonth() === i
                  );
                  if (monthHolidays.length === 0) return null;

                  return (
                    <div key={i}>
                      <h4 className="font-medium text-muted-foreground mb-1">
                        {format(new Date(2025, i, 1), 'MMMM', { locale: ru })}
                      </h4>
                      <div className="space-y-1">
                        {monthHolidays.map((holiday, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{format(holiday.date, 'd')}</span>
                            <span className="text-red-700">{holiday.holidayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Calendar; 