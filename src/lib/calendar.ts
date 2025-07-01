// Производственный календарь России 2025 года
// Составлен по официальному календарю (см. изображение)

import { startOfWeek, endOfWeek, addDays } from "date-fns";

export interface CalendarDay {
  date: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  isWorkingDay: boolean;
  holidayName?: string;
  isTransferred: boolean;
  transferredFrom?: Date;
}

// Праздничные и перенесённые выходные дни 2025 года
// Красные дни с картинки
const HOLIDAYS_2025 = [
  // Январь
  '2025-01-01','2025-01-02','2025-01-03','2025-01-04','2025-01-05','2025-01-06','2025-01-07','2025-01-08',
  // Февраль
  '2025-02-22','2025-02-23','2025-02-24',
  // Март
  '2025-03-08','2025-03-09',
  // Апрель — нет праздников
  // Май
  '2025-05-01','2025-05-02','2025-05-03','2025-05-04','2025-05-09','2025-05-10','2025-05-11',
  // Июнь
  '2025-06-12',
  // Ноябрь
  '2025-11-01','2025-11-02','2025-11-03','2025-11-04',
  // Декабрь — только стандартные выходные
];

// Переносы рабочих дней (пример: если суббота рабочая)
const TRANSFERS_2025 = [
  // В 2025 году официальных переносов рабочих дней нет (по картинке)
];

function isDateInList(date: Date, list: string[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return list.includes(dateStr);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = воскресенье, 6 = суббота
}

export function isHoliday(date: Date): boolean {
  return isDateInList(date, HOLIDAYS_2025);
}

export function getHolidayName(date: Date): string | undefined {
  // Можно добавить названия праздников по дате, если нужно
  const dateStr = date.toISOString().split('T')[0];
  switch (dateStr) {
    case '2025-01-01':
    case '2025-01-02':
    case '2025-01-03':
    case '2025-01-04':
    case '2025-01-05':
    case '2025-01-06':
    case '2025-01-08':
      return 'Новогодние каникулы';
    case '2025-01-07':
      return 'Рождество Христово';
    case '2025-02-23':
      return 'День защитника Отечества';
    case '2025-03-08':
      return 'Международный женский день';
    case '2025-05-01':
      return 'Праздник Весны и Труда';
    case '2025-05-09':
      return 'День Победы';
    case '2025-06-12':
      return 'День России';
    case '2025-11-04':
      return 'День народного единства';
    default:
      return undefined;
  }
}

export function isTransferredWorkingDay(date: Date): boolean {
  // Нет переносов в 2025
  return false;
}

export function getTransferredFrom(date: Date): Date | undefined {
  return undefined;
}

export function isWorkingDay(date: Date): boolean {
  // Если это праздник или выходной
  if (isHoliday(date) || isWeekend(date)) {
    return false;
  }
  return true;
}

export function getCalendarDay(date: Date): CalendarDay {
  return {
    date,
    isWeekend: isWeekend(date),
    isHoliday: isHoliday(date),
    isWorkingDay: isWorkingDay(date),
    holidayName: getHolidayName(date),
    isTransferred: isTransferredWorkingDay(date),
    transferredFrom: getTransferredFrom(date),
  };
}

export function getMonthCalendar(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);

  // Начало и конец календарной сетки (с понедельника по воскресенье)
  const calendarStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  let current = calendarStart;
  while (current <= calendarEnd) {
    days.push(getCalendarDay(new Date(current)));
    current = addDays(current, 1);
  }

  return days;
}

export function getWorkingDaysInPeriod(startDate: Date, endDate: Date): Date[] {
  const workingDays: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
      workingDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

export function getHolidaysInPeriod(startDate: Date, endDate: Date): CalendarDay[] {
  const holidays: CalendarDay[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isHoliday(currentDate)) {
      holidays.push(getCalendarDay(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return holidays;
}

// Получение информации о календаре на 2025 год
export function getYear2025Info() {
  const year = 2025;
  const totalDays = 365; // 2025 не високосный
  const workingDays = getWorkingDaysInPeriod(
    new Date(year, 0, 1),
    new Date(year, 11, 31)
  ).length;
  const holidays = HOLIDAYS_2025.length;
  const weekends = totalDays - workingDays - holidays;

  return {
    year,
    totalDays,
    workingDays,
    holidays,
    weekends,
    transfers: 0,
  };
} 