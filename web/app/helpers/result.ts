import { json } from "@remix-run/cloudflare";

export const good = <T extends any>(
  value: T,
  init?: number | ResponseInit | undefined
) => json<[T, null]>([value, null], init);

export const bad = <T extends any = {}>(
  err: T = {} as T,
  init?: number | ResponseInit | undefined
) => json<[null, T]>([null, err], init);
