import { json } from "@remix-run/cloudflare";

export const success = <T extends Record<any, any>>(
  value: T,
  init?: number | ResponseInit | undefined
) =>
  json(
    {
      ...value,
      error: false as const,
    },
    init
  );

export const failure = <T extends Record<any, any>>(
  value: T,
  init?: number | ResponseInit | undefined
) =>
  json(
    {
      ...value,
      error: true as const,
    },
    init
  );
