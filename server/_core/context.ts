import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { readMemberSessionFromRequest, type MemberSession } from "../memberSession";
import { getAdminUserFromSession } from "../adminSession";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  member: MemberSession | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const member = readMemberSessionFromRequest(opts.req);

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = getAdminUserFromSession(opts.req) as User | null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    member,
  };
}
