import { initTRPC } from '@trpc/server';
import { publicProcedure, router } from '../server-lib';

export const serverA_appRouter = router({
  greet: publicProcedure
    .input((val: unknown) => {
      if (typeof val === 'string') return val;
      throw new Error(`Invalid input: ${typeof val}`);
    })
    .query(({ input }) => ({ greeting: `hello, ${input}!` })),
});
