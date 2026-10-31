/**
 * Hand-written stand-in for `src/types/generated/api.d.ts` so `pnpm typecheck` does not depend
 * on `pnpm gen:api` having run. Mirrors `components.schemas.Liveness` in the server's
 * openapi.json. Once generation is routine, import from the generated file instead.
 */
export type Liveness = {
  service: string;
  status: 'up';
};
