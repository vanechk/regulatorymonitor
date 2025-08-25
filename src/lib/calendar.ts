// Производственный календарь России 2025 года
// Составлен по официальному календарю

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

// Праздничные дни 2025 года
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

// Переносы рабочих дней 2025 года
const TRANSFERS_2025 = [
  {
    from: '2025-01-03', // 3 января (пятница)
    to: '2025-05-10',   // 10 мая (суббота)
    description: 'Перенос с 3 января на 10 мая'
  },
  {
    from: '2025-01-06', // 6 января (понедельник)
    to: '2025-05-12',   // 12 мая (понедельник)
    description: 'Перенос с 6 января на 12 мая'
  },
  {
    from: '2025-01-08', // 8 января (среда)
    to: '2025-05-13',   // 13 мая (вторник)
    description: 'Перенос с 8 января на 13 мая'
  }
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
  const dateStr = date.toISOString().split('T')[0];
  return TRANSFERS_2025.some(transfer => transfer.to === dateStr);
}

export function getTransferredFrom(date: Date): Date | undefined {
  const dateStr = date.toISOString().split('T')[0];
  const transfer = TRANSFERS_2025.find(t => t.to === dateStr);
  return transfer ? new Date(transfer.from) : undefined;
}

export function isWorkingDay(date: Date): boolean {
  // Если это праздник, то не рабочий день
  if (isHoliday(date)) {
    return false;
  }
  
  // Если это перенесенный рабочий день, то рабочий
  if (isTransferredWorkingDay(date)) {
    return true;
  }
  
  // Если это выходной, то не рабочий день
  if (isWeekend(date)) {
    return false;
  }
  
  // В остальных случаях - рабочий день
  return true;
}

export function getYear2025Info() {
  const year = 2025;
  const totalDays = 365;
  
  let workingDays = 0;
  let holidays = 0;
  let weekends = 0;
  
  // Проходим по всем дням года
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      if (isHoliday(date)) {
        holidays++;
      } else if (isWorkingDay(date)) {
        workingDays++;
      } else {
        weekends++;
      }
    }
  }
  
  return {
    year,
    totalDays,
    workingDays,
    holidays,
    weekends
  };
}

export function getMonthCalendar(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // Получаем первый день недели для начала календаря
  const startDate = startOfWeek(firstDay, { weekStartsOn: 1 }); // Начинаем с понедельника
  const endDate = endOfWeek(lastDay, { weekStartsOn: 1 });
  
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    const day: CalendarDay = {
      date: new Date(currentDate),
      isWeekend: isWeekend(currentDate),
      isHoliday: isHoliday(currentDate),
      isWorkingDay: isWorkingDay(currentDate),
      holidayName: getHolidayName(currentDate),
      isTransferred: isTransferredWorkingDay(currentDate),
      transferredFrom: getTransferredFrom(currentDate)
    };
    
    days.push(day);
    currentDate = addDays(currentDate, 1);
  }
  
  return days;
}

export function getHolidaysInPeriod(startDate: Date, endDate: Date): Array<{ date: Date; holidayName: string }> {
  const holidays: Array<{ date: Date; holidayName: string }> = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isHoliday(currentDate)) {
      const holidayName = getHolidayName(currentDate);
      if (holidayName) {
        holidays.push({
          date: new Date(currentDate),
          holidayName
        });
      }
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return holidays;
}

export function getWorkingDaysInPeriod(startDate: Date, endDate: Date): Date[] {
  const workingDays: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
      workingDays.push(new Date(currentDate));
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return workingDays;
}

// Функция для получения переносов рабочих дней
export function getTransfers2025() {
  return TRANSFERS_2025.map(transfer => ({
    from: new Date(transfer.from),
    to: new Date(transfer.to),
    description: transfer.description
  }));
} 