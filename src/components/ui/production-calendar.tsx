import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";
import { 
  getMonthCalendar, 
  getYear2025Info, 
  type CalendarDay,
  isWorkingDay,
  isHoliday,
  isWeekend,
  isTransferredWorkingDay
} from "../../lib/calendar";

export interface ProductionCalendarProps {
  className?: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  showYearInfo?: boolean;
}

export function ProductionCalendar({
  className,
  selectedDate,
  onDateSelect,
  showYearInfo = true,
}: ProductionCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date(2025, 0, 1));
  const [calendarDays, setCalendarDays] = React.useState<CalendarDay[]>([]);
  const yearInfo = getYear2025Info();

  React.useEffect(() => {
    const days = getMonthCalendar(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCalendarDays(days);
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: CalendarDay) => {
    if (onDateSelect) {
      onDateSelect(day.date);
    }
  };

  const getDayClassName = (day: CalendarDay) => {
    const isCurrentMonth = isSameMonth(day.date, currentMonth);
    
    return cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 p-0 font-normal relative",
      {
        // Дни вне текущего месяца
        "text-muted-foreground opacity-50 cursor-not-allowed": !isCurrentMonth,
        
        // Текущий месяц
        "text-foreground": isCurrentMonth,
        
        // Выбранная дата
        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground": 
          selectedDate && isSameDay(day.date, selectedDate),
        
        // Рабочие дни
        "bg-green-50 text-green-700 hover:bg-green-100": 
          day.isWorkingDay && !day.isTransferred && isCurrentMonth,
        
        // Перенесенные рабочие дни
        "bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-300": 
          day.isTransferred && isCurrentMonth,
        
        // Праздничные дни
        "bg-red-50 text-red-700 hover:bg-red-100": 
          day.isHoliday && isCurrentMonth,
        
        // Выходные дни
        "bg-gray-50 text-gray-500 hover:bg-gray-100": 
          day.isWeekend && !day.isHoliday && isCurrentMonth,
      }
    );
  };

  const getDayTooltip = (day: CalendarDay) => {
    if (!isSameMonth(day.date, currentMonth)) return "";
    
    if (day.isHoliday) {
      return day.holidayName || "Праздничный день";
    }
    
    if (day.isTransferred) {
      const fromDate = day.transferredFrom;
      return `Перенесенный рабочий день (с ${fromDate ? format(fromDate, 'dd.MM.yyyy') : ''})`;
    }
    
    if (day.isWeekend) {
      return "Выходной день";
    }
    
    return "Рабочий день";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {showYearInfo && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Производственный календарь {yearInfo.year}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Всего дней:</span>
              <span className="ml-2 font-medium">{yearInfo.totalDays}</span>
            </div>
            <div>
              <span className="text-green-700">Рабочих дней:</span>
              <span className="ml-2 font-medium">{yearInfo.workingDays}</span>
            </div>
            <div>
              <span className="text-red-700">Праздников:</span>
              <span className="ml-2 font-medium">{yearInfo.holidays}</span>
            </div>
            <div>
              <span className="text-gray-700">Выходных:</span>
              <span className="ml-2 font-medium">{yearInfo.weekends}</span>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-8 w-8 p-0"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: ru })}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-8 w-8 p-0"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
            <div>Пн</div>
            <div>Вт</div>
            <div>Ср</div>
            <div>Чт</div>
            <div>Пт</div>
            <div>Сб</div>
            <div>Вс</div>
          </div>

                  {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={getDayClassName(day)}
              title={getDayTooltip(day)}
              disabled={!isSameMonth(day.date, currentMonth)}
            >
              <span className="text-xs">
                {format(day.date, "d")}
              </span>
              {day.isTransferred && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded" />
              <span>Рабочий день</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-50 border-2 border-blue-300 rounded" />
              <span>Перенесенный</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
              <span>Праздник</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded" />
              <span>Выходной</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 