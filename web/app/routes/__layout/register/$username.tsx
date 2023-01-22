import { Client } from "@passwordlessdev/passwordless-client";
import type { LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import invariant from "invariant";
import { failure, success } from "~/helpers/result";
import { client } from "dumb-durable-object";

export async function loader({ context, request, params }: LoaderArgs) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("s");
  const username = params.username;
  invariant(username !== undefined, "panic");
  invariant(secret !== null, "panic");

  const c = client(request, context.DO_USER, username);

  const result = await c.register(secret);

  if (result.error) {
    return failure({ message: "This link is invalid or expired" });
  }
  const { email, displayname } = result.value;

  const payload = {
    userId: c.stub.id.toString(),
    username,
    displayname,
    aliases: [username, email],
  };

  const token = await fetch(`${context.AUTH_API}/register/token`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      ApiSecret: context.AUTH_SECRET,
      "Content-Type": "application/json",
    },
  }).then((r) => r.text());

  return success({
    apiKey: context.AUTH_PUBLIC,
    apiUrl: context.AUTH_API,
    token,
    username,
  });
}

export default function Register() {
  const [error, setError] = useState<false | string>(false);
  const result = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    if (result?.success !== true) return;

    const f = async () => {
      try {
        const client = new Client({
          apiKey: result.apiKey,
          apiUrl: result.apiUrl,
        });
        await client.register(result.token, result.username);
        navigate("/");
      } catch (err) {
        invariant(err instanceof Error, "panic");
        setError(err.message);
      }
    };

    f();
  }, [navigate, result]);

  return (
    <div className="text-center">
      <span>{!result.success && result.message}</span>
      <span>{error}</span>
    </div>
  );
}
