import type { AppLoadContext } from "@remix-run/cloudflare";
import { createCookieSessionStorage } from "@remix-run/cloudflare";

export type User = {
  userId: string;
  timestamp: string;
  rpid: string;
  origin: string;
  success: boolean;
  device: string;
  country: string;
  nickname: null | string;
  credentialId: string;
  expiresAt: string;
};

export const cookieSession = async (
  request: Request,
  context: AppLoadContext
) => {
  const { getSession, commitSession, destroySession } =
    createContextCookieSessionStorage(context);
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("user")) {
    return { session, user: null, commitSession, destroySession };
  }

  return {
    session,
    user: JSON.parse(session.get("user")) as User,
    commitSession,
    destroySession,
  };
};

export const getCommitSession = async (
  request: Request,
  context: AppLoadContext
) => {
  const { getSession, commitSession } =
    createContextCookieSessionStorage(context);
  const session = await getSession(request.headers.get("Cookie"));

  return { session, commitSession };
};

export const verify = async (token: string, context: AppLoadContext) => {
  const response = await fetch(`${context.AUTH_API}/signin/verify`, {
    method: "POST",
    body: JSON.stringify({ token }),
    headers: {
      ApiSecret: context.AUTH_SECRET,
      "Content-Type": "application/json",
    },
  });

  return (await response.json()) as User;
};

export const createContextCookieSessionStorage = (context: AppLoadContext) =>
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 36000,
      path: "/",
      sameSite: "lax",
      secrets: [context.AUTH_COOKIE_SECRET],
      secure: true,
    },
  });
