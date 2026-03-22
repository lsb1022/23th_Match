import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock admin user context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Mock regular user context
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Mock public context (no user)
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("members router", () => {
  it("admin can list members", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.members.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot list members", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.members.list()).rejects.toThrow("관리자 권한이 필요합니다");
  });
});

describe("constants router", () => {
  it("returns time slots", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.constants.timeSlots();
    expect(result).toHaveLength(4);
    expect(result[0]).toHaveProperty("slot", 1);
    expect(result[0]).toHaveProperty("start", "12:00");
    expect(result[0]).toHaveProperty("end", "13:30");
  });

  it("returns day names", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.constants.dayNames();
    expect(result).toHaveLength(7);
    expect(result[1]).toBe("월");
    expect(result[5]).toBe("금");
  });
});

describe("memberAuth router", () => {
  it("login fails with invalid credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.memberAuth.login({ username: "nonexistent", password: "wrong" })
    ).rejects.toThrow("아이디 또는 비밀번호가 올바르지 않습니다");
  });
});

describe("schedule router", () => {
  it("public can list schedules", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.schedule.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot create schedule", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.schedule.create({ memberId: 1, dayOfWeek: 1, timeSlot: 1 })
    ).rejects.toThrow("관리자 권한이 필요합니다");
  });
});

describe("items router", () => {
  it("public can list items", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.items.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot create item", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.items.create({ name: "Test", category: "Test", location: "Test" })
    ).rejects.toThrow("관리자 권한이 필요합니다");
  });
});

describe("manuals router", () => {
  it("public can list manuals", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.manuals.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot create manual", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.manuals.create({ title: "Test", content: "Test", category: "Test" })
    ).rejects.toThrow("관리자 권한이 필요합니다");
  });
});
