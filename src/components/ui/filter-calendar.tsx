import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameMonth, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";
import { Button } from "./button";
import { 
  getMonthCalendar, 
  type CalendarDay,
  isWorkingDay,
  isHoliday,
  isWeekend,
  isTransferredWorkingDay
} from "../../lib/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface FilterCalendarProps {
  className?: string;
  selectedDateFrom?: Date;
  selectedDateTo?: Date;
  onDateFromSelect?: (date: Date) => void;
  onDateToSelect?: (date: Date) => void;
  onRangeSelect?: (from: Date, to: Date) => void;
}

export function FilterCalendar({
  className,
  selectedDateFrom,
  selectedDateTo,
  onDateFromSelect,
  onDateToSelect,
  onRangeSelect,
}: FilterCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [calendarDays, setCalendarDays] = React.useState<CalendarDay[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

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
    if (!isSameMonth(day.date, currentMonth)) return;

    if (onDateFromSelect && !selectedDateFrom) {
      onDateFromSelect(day.date);
    } else if (onDateToSelect && selectedDateFrom && !selectedDateTo) {
      if (day.date >= selectedDateFrom) {
        onDateToSelect(day.date);
        if (onRangeSelect) {
          onRangeSelect(selectedDateFrom, day.date);
        }
        setIsOpen(false);
      }
    } else if (onDateFromSelect) {
      // Сброс и выбор новой даты
      onDateFromSelect(day.date);
      if (onDateToSelect) {
        onDateToSelect(undefined as any);
      }
    }
  };

  const getDayClassName = (day: CalendarDay) => {
    const isSelected = (selectedDateFrom && isSameDay(day.date, selectedDateFrom)) ||
                      (selectedDateTo && isSameDay(day.date, selectedDateTo));
    const isInRange = selectedDateFrom && selectedDateTo && 
                     day.date >= selectedDateFrom && day.date <= selectedDateTo;

    return cn(
      buttonVariants({ variant: "ghost" }),
      "h-8 w-8 p-0 font-normal relative text-xs",
      {
        // Текущий месяц
        "text-foreground": isSameMonth(day.date, currentMonth),
        "text-muted-foreground": !isSameMonth(day.date, currentMonth),
        
        // Выбранная дата
        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground": 
          isSelected && isSameMonth(day.date, currentMonth),
        
        // Диапазон
        "bg-primary/20 text-primary-foreground": 
          isInRange && !isSelected && isSameMonth(day.date, currentMonth),
        
        // Рабочие дни
        "bg-green-50 text-green-700 hover:bg-green-100": 
          day.isWorkingDay && !day.isTransferred && !isSelected && !isInRange && isSameMonth(day.date, currentMonth),
        
        // Перенесенные рабочие дни
        "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300": 
          day.isTransferred && !isSelected && !isInRange && isSameMonth(day.date, currentMonth),
        
        // Праздничные дни
        "bg-red-50 text-red-700 hover:bg-red-100": 
          day.isHoliday && !isSelected && !isInRange && isSameMonth(day.date, currentMonth),
        
        // Выходные дни
        "bg-gray-50 text-gray-500 hover:bg-gray-100": 
          day.isWeekend && !day.isHoliday && !isSelected && !isInRange && isSameMonth(day.date, currentMonth),
      }
    );
  };

  const getDisplayText = () => {
    if (selectedDateFrom && selectedDateTo) {
      return `${format(selectedDateFrom, 'dd.MM.yyyy')} - ${format(selectedDateTo, 'dd.MM.yyyy')}`;
    } else if (selectedDateFrom) {
      return `${format(selectedDateFrom, 'dd.MM.yyyy')} - Выберите конечную дату`;
    }
    return "Выберите период";
  };

  const clearSelection = () => {
    if (onDateFromSelect) onDateFromSelect(undefined as any);
    if (onDateToSelect) onDateToSelect(undefined as any);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDateFrom && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 p-0"
              )}
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            
            <h3 className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy", { locale: ru })}
            </h3>
            
            <button
              onClick={goToNextMonth}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 p-0"
              )}
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
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
                  title={isSameMonth(day.date, currentMonth) ? 
                    `${format(day.date, 'dd.MM.yyyy')} - ${day.isWorkingDay ? 'Рабочий день' : 'Выходной'}` : 
                    ""
                  }
                >
                  <span>{format(day.date, "d")}</span>
                  {day.isTransferred && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs"
            >
              Очистить
            </Button>
            <div className="text-xs text-muted-foreground">
              {selectedDateFrom && selectedDateTo ? 
                `${Math.ceil((selectedDateTo.getTime() - selectedDateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1} дней` : 
                ""
              }
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-50 border border-green-200 rounded" />
              <span>Рабочий</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-50 border border-red-200 rounded" />
              <span>Праздник</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-50 border border-blue-300 rounded" />
              <span>Перенесенный</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-50 border border-gray-200 rounded" />
              <span>Выходной</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 