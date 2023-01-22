/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

import "@remix-run/cloudflare";
import type { DurableObjectNamespaceIs } from "dumbo-rpc";
import type { DurableObjectUser } from "user";
declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    AUTH_SECRET: string;
    AUTH_PUBLIC: string;
    AUTH_API: string;
    AUTH_COOKIE_SECRET: string;
    DO_USER: DurableObjectNamespaceIs<DurableObjectUser>;
  }
}
