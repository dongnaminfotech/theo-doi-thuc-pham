import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek, isAfter, isBefore, isSameDay } from 'date-fns';

export const TIMEZONE_VN = 'Asia/Ho_Chi_Minh';
export const VN_OFFSET_HOURS = 7;

/**
 * Returns today's date in Vietnam timezone formatted as YYYY-MM-DD
 */
export function getTodayVN(): string {
  const now = new Date();
  const vnFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_VN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return vnFormatter.format(now); // en-CA gives YYYY-MM-DD
}

/**
 * Validates if string is a valid YYYY-MM-DD date and matches real calendar dates
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Parses a YYYY-MM-DD Vietnam local date into UTC Date object at 00:00:00 VN time (which is 17:00:00 UTC previous day)
 */
export function parseVNLocalDateToUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // 00:00 VN time is (00 - 7) = 17:00 UTC previous day
  return new Date(Date.UTC(year, month - 1, day, -VN_OFFSET_HOURS, 0, 0, 0));
}

/**
 * Formats a UTC Date to Vietnam YYYY-MM-DD
 */
export function formatUTCToVNDate(utcDate: Date): string {
  const vnTime = new Date(utcDate.getTime() + VN_OFFSET_HOURS * 60 * 60 * 1000);
  const year = vnTime.getUTCFullYear();
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a UTC Date to Vietnam YYYY-MM-DD HH:mm:ss
 */
export function formatUTCToVNFull(utcDate: Date): string {
  const vnTime = new Date(utcDate.getTime() + VN_OFFSET_HOURS * 60 * 60 * 1000);
  const year = vnTime.getUTCFullYear();
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  const hours = String(vnTime.getUTCHours()).padStart(2, '0');
  const minutes = String(vnTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(vnTime.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Gets the start of a VN day in UTC Date (00:00:00.000 VN)
 */
export function getVNStartOfDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, -VN_OFFSET_HOURS, 0, 0, 0));
}

/**
 * Gets the end of a VN day in UTC Date (23:59:59.999 VN)
 */
export function getVNEndOfDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23 - VN_OFFSET_HOURS, 59, 59, 999));
}

/**
 * Formats YYYY-MM-DD to Vietnamese display date (e.g., "Thứ Hai, 29/09/2026")
 */
export function formatVNDateFull(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const date = parseISO(dateStr);
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeek = dayNames[date.getDay()];
  const formattedDate = format(date, 'dd/MM/yyyy');
  return `${dayOfWeek}, ${formattedDate}`;
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatVNDateShort(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const date = parseISO(dateStr);
  return format(date, 'dd/MM/yyyy');
}

/**
 * Gets week dates (Monday to Sunday) containing the given date
 */
export function getWeekDates(dateStr: string): Array<{ date: string; dayName: string; dayNumber: number; isToday: boolean }> {
  const current = parseISO(dateStr);
  const start = startOfWeek(current, { weekStartsOn: 1 }); // Monday = 1
  const today = getTodayVN();
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: dayStr,
      dayName: dayNames[i],
      dayNumber: i === 6 ? 7 : i + 1, // 1 to 7 (1=T2, 7=CN)
      isToday: dayStr === today,
    };
  });
}

/**
 * Gets previous and next day
 */
export function getAdjacentDays(dateStr: string): { prev: string; next: string } {
  const date = parseISO(dateStr);
  return {
    prev: format(subDays(date, 1), 'yyyy-MM-dd'),
    next: format(addDays(date, 1), 'yyyy-MM-dd'),
  };
}

/**
 * Gets ISO Day of week: 1 (Monday) to 7 (Sunday)
 */
export function getDayOfWeekNumber(dateStr: string): number {
  const date = parseISO(dateStr);
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

