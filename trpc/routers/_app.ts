import { createTRPCRouter } from "../init";
import { resultRouter } from "./result";

export const appRouter = createTRPCRouter({
  result: resultRouter,
});

export type AppRouter = typeof appRouter;