import { Client } from "@passwordlessdev/passwordless-client";
import type { LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import type { UserData } from "user";
import invariant from "invariant";
import { failure, success } from "~/helpers/result";

export async function loader({ context, request, params }: LoaderArgs) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("s") ?? "";
  const username = params.username;
  invariant(username !== undefined, "panic");

  const id = context.DO_USER.idFromName(username);
  const stub = context.DO_USER.get(id);

  const response = await stub.fetch(`${url.origin}/register`, { body: secret });
  if (!response.ok) {
    return failure({ message: "This link is invalid or expired" });
  }
  const { token }: UserData = await response.json();
  return success({
    apiKey: context.AUTH_PUBLIC,
    apiUrl: context.AUTH_API,
    token,
    username,
  });
}

export default function Register() {
  const result = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    if (result?.success !== true) return;

    const f = async () => {
      const client = new Client({
        apiKey: result.apiKey,
        apiUrl: result.apiUrl,
      });
      await client.register(result.token, result.username);
      navigate("/");
    };

    f();
  }, [navigate, result]);

  return <div>{!result.success && result.message}</div>;
}
