import { describe, expect, it } from "vitest";

// 한국 시간대(KST) 변환 함수들
function getKSTDate(date: Date = new Date()): Date {
  const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return kstDate;
}

function getKSTDateString(date: Date = new Date()): string {
  const kstDate = getKSTDate(date);
  return kstDate.toISOString().split('T')[0];
}

function getKSTDayOfWeek(date: Date = new Date()): number {
  const kstDate = getKSTDate(date);
  const utcDay = kstDate.getUTCDay();
  return utcDay;
}

describe("Timezone conversion (KST)", () => {
  it("should convert UTC to KST correctly", () => {
    // 2025-12-16 00:00:00 UTC = 2025-12-16 09:00:00 KST
    const utcDate = new Date("2025-12-16T00:00:00Z");
    const kstDate = getKSTDate(utcDate);
    
    // KST should be 9 hours ahead
    expect(kstDate.getUTCHours()).toBe(9);
  });

  it("should return correct date string for KST", () => {
    // 2025-12-16 00:00:00 UTC = 2025-12-16 09:00:00 KST
    const utcDate = new Date("2025-12-16T00:00:00Z");
    const dateString = getKSTDateString(utcDate);
    
    expect(dateString).toBe("2025-12-16");
  });

  it("should return correct day of week for KST", () => {
    // 2025-12-16 is Tuesday in KST
    // UTC: 2025-12-16 00:00:00 = KST: 2025-12-16 09:00:00 (Tuesday)
    const utcDate = new Date("2025-12-16T00:00:00Z");
    const dayOfWeek = getKSTDayOfWeek(utcDate);
    
    // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    expect(dayOfWeek).toBe(2); // Tuesday
  });

  it("should handle date boundary correctly", () => {
    // 2025-12-15 23:00:00 UTC = 2025-12-16 08:00:00 KST (still same day in KST)
    const utcDate = new Date("2025-12-15T23:00:00Z");
    const dateString = getKSTDateString(utcDate);
    
    expect(dateString).toBe("2025-12-16");
  });

  it("should handle previous day boundary correctly", () => {
    // 2025-12-15 14:59:59 UTC = 2025-12-15 23:59:59 KST (previous day)
    const utcDate = new Date("2025-12-15T14:59:59Z");
    const dateString = getKSTDateString(utcDate);
    
    expect(dateString).toBe("2025-12-15");
  });

  it("should correctly identify weekdays", () => {
    // Test a full week
    const testDates = [
      { utc: "2025-12-15T00:00:00Z", expectedDay: 1, dayName: "Monday" },    // 2025-12-15 09:00 KST = Monday
      { utc: "2025-12-16T00:00:00Z", expectedDay: 2, dayName: "Tuesday" },   // 2025-12-16 09:00 KST = Tuesday
      { utc: "2025-12-17T00:00:00Z", expectedDay: 3, dayName: "Wednesday" }, // 2025-12-17 09:00 KST = Wednesday
      { utc: "2025-12-18T00:00:00Z", expectedDay: 4, dayName: "Thursday" },  // 2025-12-18 09:00 KST = Thursday
      { utc: "2025-12-19T00:00:00Z", expectedDay: 5, dayName: "Friday" },    // 2025-12-19 09:00 KST = Friday
      { utc: "2025-12-20T00:00:00Z", expectedDay: 6, dayName: "Saturday" },  // 2025-12-20 09:00 KST = Saturday
      { utc: "2025-12-21T00:00:00Z", expectedDay: 0, dayName: "Sunday" },    // 2025-12-21 09:00 KST = Sunday
    ];

    testDates.forEach(({ utc, expectedDay, dayName }) => {
      const utcDate = new Date(utc);
      const dayOfWeek = getKSTDayOfWeek(utcDate);
      expect(dayOfWeek).toBe(expectedDay);
    });
  });

  it("should identify weekends correctly", () => {
    // Saturday
    const saturdayUtc = new Date("2025-12-20T00:00:00Z");
    const saturdayDay = getKSTDayOfWeek(saturdayUtc);
    expect(saturdayDay === 0 || saturdayDay === 6).toBe(true);

    // Sunday
    const sundayUtc = new Date("2025-12-21T00:00:00Z");
    const sundayDay = getKSTDayOfWeek(sundayUtc);
    expect(sundayDay === 0 || sundayDay === 6).toBe(true);
  });

  it("should identify weekdays correctly", () => {
    // Monday through Friday
    const weekdayUtcs = [
      "2025-12-15T00:00:00Z", // Monday
      "2025-12-16T00:00:00Z", // Tuesday
      "2025-12-17T00:00:00Z", // Wednesday
      "2025-12-18T00:00:00Z", // Thursday
      "2025-12-19T00:00:00Z", // Friday
    ];

    weekdayUtcs.forEach((utc) => {
      const utcDate = new Date(utc);
      const dayOfWeek = getKSTDayOfWeek(utcDate);
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      expect(isWeekday).toBe(true);
    });
  });
});
