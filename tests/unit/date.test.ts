import { describe, it, expect } from 'vitest';
import {
  parseVNLocalDateToUTC,
  formatUTCToVNDate,
  formatUTCToVNFull,
  getTodayVN,
  isValidDateString,
  getVNStartOfDay,
  getVNEndOfDay,
} from '@/lib/date';

describe('Date & Vietnam Timezone (UTC+7) Utilities', () => {
  it('should parse YYYY-MM-DD local VN date to correct UTC Date object at 00:00:00 VN time', () => {
    // 2026-09-29 00:00:00 GMT+7 is 2026-09-28 17:00:00 UTC
    const utcDate = parseVNLocalDateToUTC('2026-09-29');
    expect(utcDate.toISOString()).toBe('2026-09-28T17:00:00.000Z');
  });

  it('should format UTC Date back to YYYY-MM-DD VN format correctly', () => {
    // 2026-09-28 17:00:00 UTC corresponds to 2026-09-29 in VN
    const utcDate = new Date('2026-09-28T17:00:00.000Z');
    expect(formatUTCToVNDate(utcDate)).toBe('2026-09-29');

    // 2026-09-28 16:59:59 UTC corresponds to 2026-09-28 in VN
    const priorUtcDate = new Date('2026-09-28T16:59:59.000Z');
    expect(formatUTCToVNDate(priorUtcDate)).toBe('2026-09-28');
  });

  it('should correctly format full VN datetime string', () => {
    const utcDate = new Date('2026-09-28T17:30:00.000Z');
    const formatted = formatUTCToVNFull(utcDate);
    expect(formatted).toBe('2026-09-29 00:30:00');
  });

  it('should validate date strings correctly', () => {
    expect(isValidDateString('2026-09-29')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false); // Invalid day in Feb
    expect(isValidDateString('invalid-date')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false); // Invalid month
    expect(isValidDateString('29-09-2026')).toBe(false);
  });

  it('should get correct start and end of VN day', () => {
    const start = getVNStartOfDay('2026-09-29');
    const end = getVNEndOfDay('2026-09-29');

    expect(start.toISOString()).toBe('2026-09-28T17:00:00.000Z');
    expect(end.toISOString()).toBe('2026-09-29T16:59:59.999Z');
  });

  it('should return valid today string in format YYYY-MM-DD', () => {
    const today = getTodayVN();
    expect(isValidDateString(today)).toBe(true);
  });
});
