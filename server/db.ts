import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  members, InsertMember, Member,
  attendances, InsertAttendance, Attendance,
  schedules, InsertSchedule, Schedule,
  swapRequests, InsertSwapRequest, SwapRequest,
  items, InsertItem, Item,
  manuals, InsertManual, Manual,
  qrSettings, InsertQrSetting, QrSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== User Functions ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== Member Functions ====================
export async function createMember(member: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(members).values(member);
  return result;
}

export async function getMemberByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(members).where(eq(members.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMembers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(members).orderBy(desc(members.createdAt));
}

export async function updateMember(id: number, data: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(members).set(data).where(eq(members.id, id));
}

export async function deleteMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(members).where(eq(members.id, id));
}

// ==================== Attendance Functions ====================
export async function createAttendance(attendance: InsertAttendance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(attendances).values(attendance);
  return result;
}

export async function getAttendanceByMemberAndDate(memberId: number, date: string, timeSlot: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(attendances)
    .where(and(
      eq(attendances.memberId, memberId),
      sql`${attendances.date} = ${date}`,
      eq(attendances.timeSlot, timeSlot)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAttendance(id: number, data: Partial<InsertAttendance>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(attendances).set(data).where(eq(attendances.id, id));
}

export async function getAttendancesByMember(memberId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(attendances).where(eq(attendances.memberId, memberId));
  
  return await query.orderBy(desc(attendances.date));
}

export async function getAttendancesByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(attendances)
    .where(sql`${attendances.date} = ${date}`)
    .orderBy(asc(attendances.timeSlot));
}

export async function getAllAttendances(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(attendances)
    .orderBy(desc(attendances.date), asc(attendances.timeSlot))
    .limit(limit);
}

// ==================== Schedule Functions ====================
export async function createSchedule(schedule: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(schedules).values(schedule);
  return result;
}

export async function getSchedulesByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(schedules)
    .where(and(eq(schedules.memberId, memberId), eq(schedules.isActive, true)))
    .orderBy(asc(schedules.dayOfWeek), asc(schedules.timeSlot));
}

export async function getSchedulesByDay(dayOfWeek: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(schedules)
    .where(and(eq(schedules.dayOfWeek, dayOfWeek), eq(schedules.isActive, true)))
    .orderBy(asc(schedules.timeSlot));
}

export async function getSchedulesByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  
  // date를 기반으로 요일 계산 (1: 월, 2: 화, 3: 수, 4: 목, 5: 금)
  const dateObj = new Date(date + 'T00:00:00Z');
  const utcDay = dateObj.getUTCDay();
  const dayOfWeek = utcDay === 0 ? 7 : utcDay; // 일요일(0)을 7로 변환
  
  // 월~금만 (1~5)
  if (dayOfWeek < 1 || dayOfWeek > 5) return [];
  
  return await db.select().from(schedules)
    .where(and(eq(schedules.dayOfWeek, dayOfWeek), eq(schedules.isActive, true)))
    .orderBy(asc(schedules.timeSlot));
}

export async function getAllSchedules() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(schedules)
    .where(eq(schedules.isActive, true))
    .orderBy(asc(schedules.dayOfWeek), asc(schedules.timeSlot));
}

export async function updateSchedule(id: number, data: Partial<InsertSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(schedules).set(data).where(eq(schedules.id, id));
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(schedules).where(eq(schedules.id, id));
}

// ==================== Swap Request Functions ====================
export async function createSwapRequest(request: InsertSwapRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(swapRequests).values(request);
  return result;
}

export async function getSwapRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(swapRequests).where(eq(swapRequests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSwapRequestsByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(swapRequests)
    .where(eq(swapRequests.requesterId, memberId))
    .orderBy(desc(swapRequests.createdAt));
}

export async function getPendingSwapRequests() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(swapRequests)
    .where(eq(swapRequests.status, "pending"))
    .orderBy(desc(swapRequests.createdAt));
}

export async function getAllSwapRequests(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(swapRequests)
    .orderBy(desc(swapRequests.createdAt))
    .limit(limit);
}

export async function updateSwapRequest(id: number, data: Partial<InsertSwapRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(swapRequests).set(data).where(eq(swapRequests.id, id));
}

// ==================== Item Functions ====================
export async function createItem(item: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(items).values(item);
  return result;
}

export async function getAllItems() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(items).orderBy(asc(items.category), asc(items.name));
}

export async function getItemsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(items)
    .where(eq(items.category, category))
    .orderBy(asc(items.name));
}

export async function updateItem(id: number, data: Partial<InsertItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(items).set(data).where(eq(items.id, id));
}

export async function deleteItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(items).where(eq(items.id, id));
}

// ==================== Manual Functions ====================
export async function createManual(manual: InsertManual) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(manuals).values(manual);
  return result;
}

export async function getAllManuals() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(manuals)
    .where(eq(manuals.isPublished, true))
    .orderBy(asc(manuals.category), asc(manuals.orderIndex));
}

export async function getManualsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(manuals)
    .where(and(eq(manuals.category, category), eq(manuals.isPublished, true)))
    .orderBy(asc(manuals.orderIndex));
}

export async function updateManual(id: number, data: Partial<InsertManual>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(manuals).set(data).where(eq(manuals.id, id));
}

export async function deleteManual(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(manuals).where(eq(manuals.id, id));
}

// ==================== QR Settings Functions ====================
export async function getActiveQrSetting() {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(qrSettings)
    .where(eq(qrSettings.isActive, true))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createQrSetting(setting: InsertQrSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(qrSettings).values(setting);
  return result;
}

export async function updateQrSetting(id: number, data: Partial<InsertQrSetting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(qrSettings).set(data).where(eq(qrSettings.id, id));
}

// ==================== Statistics Functions ====================
export async function getAttendanceStats(memberId: number) {
  const db = await getDb();
  if (!db) return { present: 0, late: 0, absent: 0, total: 0 };
  
  const result = await db.select({
    status: attendances.status,
    count: sql<number>`count(*)`.as('count')
  })
    .from(attendances)
    .where(eq(attendances.memberId, memberId))
    .groupBy(attendances.status);
  
  const stats = { present: 0, late: 0, absent: 0, total: 0 };
  result.forEach(row => {
    if (row.status === 'present') stats.present = Number(row.count);
    else if (row.status === 'late') stats.late = Number(row.count);
    else if (row.status === 'absent') stats.absent = Number(row.count);
  });
  stats.total = stats.present + stats.late + stats.absent;
  
  return stats;
}
