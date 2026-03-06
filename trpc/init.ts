import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyToken } from "@/lib/apiToken";

export interface TRPCContext {
  headers: Headers;
}

export const createTRPCContext = async (opts: {
  headers: Headers;
}): Promise<TRPCContext> => {
  return { headers: opts.headers };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const forwarded = ctx.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || ctx.headers.get("x-real-ip") || "unknown";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 1000)}s.`,
    });
  }

  const token = ctx.headers.get("x-api-token") || "";
  if (!verifyToken(token)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid or expired request token. Please refresh the page.",
    });
  }

  return next({ ctx: { ...ctx, ip } });
});