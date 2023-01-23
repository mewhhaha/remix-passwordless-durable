import type { AppLoadContext } from "@remix-run/cloudflare";

export type Credential = {
  aaGuid: string;
  country: string;
  createdAt: string;
  credType: string;
  descriptor: {
    id: string;
    type: string;
  };
  device: string;
  lastUsedAt: string;
  origin: string;
  publicKey: string;
  rpid: string;
  signatureCounter: number;
  userHandle: string;
  userId: string;
  nickname: string;
};

export type CredentialsRequest = {
  userId: string;
};

export const credentialsList = async (
  context: AppLoadContext,
  request: CredentialsRequest
) => {
  const response = await fetch(`${context.AUTH_API}/credentials/list`, {
    method: "POST",
    body: JSON.stringify(request),
    headers: {
      ApiSecret: context.AUTH_SECRET,
      "Content-Type": "application/json",
    },
  });

  return response.json<Credential[]>();
};

type CredentialsDeleteRequest = {
  CredentialId: string;
};

export const credentialsDelete = async (
  context: AppLoadContext,
  request: CredentialsDeleteRequest
) => {
  await fetch(`${context.AUTH_API}/credentials/list`, {
    method: "POST",
    body: JSON.stringify(request),
    headers: {
      ApiSecret: context.AUTH_SECRET,
      "Content-Type": "application/json",
    },
  });
};

export type RegisterTokenRequest = {
  userId: string;
  username: string;
  displayname: string;
  aliases: string[];
};

export const registerToken = async (
  context: AppLoadContext,
  request: RegisterTokenRequest
) => {
  const response = await fetch(`${context.AUTH_API}/register/token`, {
    method: "POST",
    body: JSON.stringify(request),
    headers: {
      ApiSecret: context.AUTH_SECRET,
      "Content-Type": "application/json",
    },
  });

  return response.text();
};

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

export const signinVerify = async (context: AppLoadContext, token: string) => {
  const response = await fetch(`${context.AUTH_API}/signin/verify`, {
    method: "POST",
    body: JSON.stringify({ token }),
    headers: {
      ApiSecret: context.AUTH_SECRET,
      "Content-Type": "application/json",
    },
  });

  return response.json<User>();
};
