import { json } from "@remix-run/cloudflare";

export const success = <T extends Record<any, any>>(
  value: T,
  init?: number | ResponseInit | undefined
) =>
  json(
    {
      ...value,
      success: true as const,
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
      success: false as const,
    },
    init
  );
