import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  Info, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Clock,
  Gift
} from 'lucide-react';
import { 
  getYear2025Info, 
  getHolidaysInPeriod, 
  getWorkingDaysInPeriod,
  getTransfers2025,
  type CalendarDay 
} from '../../lib/calendar';

function Calendar() {
  // ✅ Инициализируем с текущим месяцем вместо фиксированного января 2025
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [yearInfo, setYearInfo] = useState(getYear2025Info());
  const [transfers, setTransfers] = useState(getTransfers2025());

  // ✅ Автоматически обновляем информацию о годе при изменении currentDate
  useEffect(() => {
    const currentYear = currentDate.getFullYear();
    if (currentYear === 2025) {
      setYearInfo(getYear2025Info());
      setTransfers(getTransfers2025());
    } else {
      // Для других лет показываем базовую информацию
      setYearInfo({
        totalDays: 365,
        workingDays: 0, // Будет рассчитано динамически
        holidays: 0,
        weekends: 0
      });
      setTransfers([]);
    }
  }, [currentDate]);

  // ✅ Получаем праздники для текущего года
  const allHolidays = getHolidaysInPeriod(
    new Date(currentDate.getFullYear(), 0, 1),
    new Date(currentDate.getFullYear(), 11, 31)
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToCurrentYear = () => {
    // ✅ Переходим к началу текущего года вместо фиксированного 2025
    const currentYear = new Date().getFullYear();
    setCurrentDate(new Date(currentYear, 0, 1));
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

  // Функция для получения названия месяца в именительном падеже с заглавной буквы
  const getMonthName = (date: Date) => {
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return monthNames[date.getMonth()];
  };

  // Генерируем календарную сетку для текущего месяца
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    // Последний день месяца
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого дня (0 = воскресенье, 1 = понедельник)
    const firstDayOfWeek = firstDay.getDay();
    // Корректируем для начала недели с понедельника
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Количество дней в предыдущем месяце для отображения
    const prevMonthDays = startOffset;
    const currentMonthDays = lastDay.getDate();
    const nextMonthDays = 42 - (prevMonthDays + currentMonthDays); // 6 недель * 7 дней
    
    const grid = [];
    
    // Дни предыдущего месяца
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      grid.push({
        date,
        isCurrentMonth: false,
        isSelected: selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isWorking: getWorkingDaysInPeriod(date, date).length > 0,
        isHoliday: getHolidaysInPeriod(date, date).length > 0,
        holidayName: getHolidaysInPeriod(date, date)[0]?.holidayName,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    
    // Дни текущего месяца
    for (let i = 1; i <= currentMonthDays; i++) {
      const date = new Date(year, month, i);
      grid.push({
        date,
        isCurrentMonth: true,
        isSelected: selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isWorking: getWorkingDaysInPeriod(date, date).length > 0,
        isHoliday: getHolidaysInPeriod(date, date).length > 0,
        holidayName: getHolidaysInPeriod(date, date)[0]?.holidayName,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    
    // Дни следующего месяца
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      grid.push({
        date,
        isCurrentMonth: false,
        isSelected: selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isWorking: getWorkingDaysInPeriod(date, date).length > 0,
        isHoliday: getHolidaysInPeriod(date, date).length > 0,
        holidayName: getHolidaysInPeriod(date, date)[0]?.holidayName,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    
    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  const getDayClassName = (day: any) => {
    let baseClasses = "h-16 w-full p-2 text-sm font-medium rounded-lg transition-all duration-200 flex flex-col items-center justify-center relative";
    
    if (!day.isCurrentMonth) {
      baseClasses += " text-gray-400 bg-gray-50";
    } else if (day.isSelected) {
      baseClasses += " bg-blue-600 text-white shadow-lg scale-105";
    } else if (day.isToday) {
      baseClasses += " bg-blue-100 text-blue-800 border-2 border-blue-300";
    } else if (day.isHoliday) {
      baseClasses += " bg-red-100 text-red-700 hover:bg-red-200";
    } else if (day.isWorking) {
      baseClasses += " bg-green-100 text-green-700 hover:bg-green-200";
    } else if (day.isWeekend) {
      baseClasses += " bg-gray-100 text-gray-600 hover:bg-gray-200";
    } else {
      baseClasses += " bg-white text-gray-700 hover:bg-gray-50";
    }
    
    return baseClasses;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Производственный календарь
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Календарь рабочих дней, праздников и переносов на 2025 год
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Основной календарь */}
        <div className="xl:col-span-3">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="hover:bg-blue-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {getMonthName(currentDate)} {currentDate.getFullYear()}
                    </h2>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    className="hover:bg-blue-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentDate(new Date())}
                    className="bg-white hover:bg-blue-50"
                    title="Перейти к текущему месяцу"
                  >
                    Сегодня
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goToCurrentYear}
                    className="bg-white hover:bg-blue-50"
                  >
                    {currentDate.getFullYear()}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Дни недели */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div key={day} className="h-12 flex items-center justify-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Календарная сетка */}
              <div className="grid grid-cols-7 gap-2">
                {calendarGrid.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day.date)}
                    className={getDayClassName(day)}
                    disabled={!day.isCurrentMonth}
                  >
                    <span className="text-lg font-semibold mb-1">
                      {format(day.date, "d")}
                    </span>
                    {day.holidayName && (
                      <span className="text-xs text-center leading-tight px-1 break-words">
                        {day.holidayName}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Легенда */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Легенда</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded border border-green-300" />
                    <span className="text-sm">Рабочий день</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded border border-red-300" />
                    <span className="text-sm">Праздник</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded border border-gray-300" />
                    <span className="text-sm">Выходной</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded border-2 border-blue-300" />
                    <span className="text-sm">Сегодня</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель */}
        <div className="space-y-4">
          {/* Информация о выбранной дате */}
          {selectedDateInfo && (
            <Card className="shadow-lg border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                  <CalendarIcon className="h-5 w-5" />
                  {selectedDateInfo.dateStr}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">День недели:</span>
                  <span className="font-semibold text-blue-800">{selectedDateInfo.dayOfWeek}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Тип дня:</span>
                  <div>
                    {selectedDateInfo.isHoliday ? (
                      <Badge variant="destructive" className="text-xs">
                        <Gift className="h-3 w-3 mr-1" />
                        Праздничный
                      </Badge>
                    ) : selectedDateInfo.isWorking ? (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Рабочий
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Выходной
                      </Badge>
                    )}
                  </div>
                </div>

                {selectedDateInfo.holidayName && (
                  <div className="p-2 bg-red-50 rounded-lg">
                    <span className="text-sm text-red-700 font-medium">Праздник:</span>
                    <p className="text-red-800 font-semibold">{selectedDateInfo.holidayName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Статистика года */}
          <Card className="shadow-lg border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                Статистика 2025
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">{yearInfo.totalDays}</div>
                  <div className="text-xs text-blue-600">Всего дней</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">{yearInfo.workingDays}</div>
                  <div className="text-xs text-green-600">Рабочих дней</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-700">{yearInfo.holidays}</div>
                  <div className="text-xs text-red-600">Праздников</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-700">{yearInfo.weekends}</div>
                  <div className="text-xs text-gray-600">Выходных</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Переносы рабочих дней */}
          <Card className="shadow-lg border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                <AlertCircle className="h-5 w-5" />
                Переносы рабочих дней
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transfers.map((transfer, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purple-800">
                        {format(transfer.from, 'd', { locale: ru })} {getMonthName(transfer.from)} ({format(transfer.from, 'EEEE', { locale: ru })})
                      </span>
                      <span className="text-purple-600 font-semibold">
                        → {format(transfer.to, 'd', { locale: ru })} {getMonthName(transfer.to)} ({format(transfer.to, 'EEEE', { locale: ru })})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Праздники по месяцам */}
          <Card className="shadow-lg border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <Gift className="h-5 w-5" />
                Праздники по месяцам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthHolidays = allHolidays.filter(
                    holiday => holiday.date.getMonth() === i
                  );
                  if (monthHolidays.length === 0) return null;

                  return (
                    <div key={i} className="border-l-2 border-red-200 pl-3">
                      <h4 className="font-semibold text-red-700 mb-2 text-sm">
                        {getMonthName(new Date(2025, i, 1))}
                      </h4>
                      <div className="space-y-1">
                        {monthHolidays.map((holiday, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-red-800">
                              {format(holiday.date, 'd')}
                            </span>
                            <span className="text-xs text-red-700 text-right">
                              {holiday.holidayName}
                            </span>
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