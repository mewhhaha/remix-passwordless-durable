import { Client } from "@passwordlessdev/passwordless-client";
import type { LoaderArgs } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { useEffect, useState } from "react";
import invariant from "invariant";
import { bad, good } from "~/helpers/result";
import { client } from "dumb-durable-object";
import { registerToken } from "~/helpers/passwordless";

export async function loader({ context, request, params }: LoaderArgs) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("s");
  const username = params.username;
  invariant(username !== undefined, "panic");
  invariant(secret !== null, "panic");

  const c = client(request, context.DO_USER, username);

  const [credentials, error] = await c.register(secret);

  if (error) {
    console.error(error.value, error.status);
    return bad({ message: "This link is invalid or expired" });
  }

  const payload = {
    userId: c.stub.id.toString(),
    username,
    displayname: credentials.displayname,
    aliases: [username, credentials.email],
  };

  const [token, err] = await registerToken(context, payload);
  if (err) {
    return bad({ message: "This email or username is already taken" });
  }

  return good({
    apiKey: context.AUTH_PUBLIC,
    apiUrl: context.AUTH_API,
    token,
    username,
  });
}

export default function Register() {
  const [config, loaderError] = useLoaderData<typeof loader>();
  const [error, setError] = useState<false | string>(
    loaderError !== null ? loaderError.message : false
  );
  const navigate = useNavigate();
  const submit = useSubmit();

  useEffect(() => {
    if (loaderError !== null) return;

    const f = async () => {
      try {
        const client = new Client({
          apiKey: config.apiKey,
          apiUrl: config.apiUrl,
        });

        await client.register(config.token, config.username);
        setTimeout(() =>
          submit({ token: config.token }, { action: "/login", method: "post" })
        );
      } catch (err) {
        invariant(err instanceof Error, "panic");
        setError(err.message);
      }
    };

    f();
  }, [navigate, config, submit, loaderError]);

  return (
    <div className="text-center">
      <span>{error}</span>
    </div>
  );
}
