import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../init";
import { loginKTU } from "@/lib/ktuLogin";
import { scrapeKTUResults } from "@/lib/ktuScraprt";
import { generateToken } from "@/lib/apiToken";
import { TRPCError } from "@trpc/server";

const getResultsInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  semesterId: z.number().int().min(1).max(8),
  studentId: z.string().optional(),
});

export const resultRouter = createTRPCRouter({
  getToken: publicProcedure.query(() => {
    return generateToken();
  }),

  getResults: protectedProcedure
    .input(getResultsInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { sessionId, csrfToken, cookies } = await loginKTU(
          input.username,
          input.password
        );
        const result = await scrapeKTUResults({
          sessionId,
          csrfToken,
          semesterId: input.semesterId,
          studentId: input.studentId,
          cookies,
        });

        return {
          courses: result.courses,
          count: result.courses.length,
        };
      } catch (error) {
        console.error("[TRPC] KTU SCRAPER ERROR:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Unknown scraper error",
        });
      }
    }),
});