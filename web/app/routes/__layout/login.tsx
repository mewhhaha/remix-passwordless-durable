import { Client } from "@passwordlessdev/passwordless-client";
import { Button } from "~/components/Button";
import { cookieSession } from "~/helpers/auth";
import {
  Link,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/cloudflare";
import { failure, success } from "~/helpers/result";
import { signinVerify } from "~/helpers/passwordless";
import { readForm } from "~/helpers/form";

export async function loader({ context }: LoaderArgs) {
  return { apiKey: context.AUTH_PUBLIC, apiUrl: context.AUTH_API };
}

export async function action({ request, context }: ActionArgs) {
  const { session, commitSession } = await cookieSession(request, context);

  const { error, token } = await readForm(request, ["token"]);
  if (error) {
    return failure({ message: "Missing form data" });
  }

  const result = await signinVerify(context, token);
  if (!result.success) {
    return failure({ message: "Login was not successful" });
  }

  session.set("user", JSON.stringify(result));
  return success(
    {},
    {
      status: 302,
      headers: { "Set-Cookie": await commitSession(session), Location: "/" },
    }
  );
}

export default function Login() {
  const clientConfig = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  const submit = useSubmit();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const client = new Client(clientConfig);
        const formData = new FormData(e.target as HTMLFormElement);
        const username = formData.get("username")?.toString();
        if (username) {
          const token = await client.signinWithAlias(username);
          submit({ token }, { method: "post" });
        }
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col">
        <label>Username</label>
        <input
          required
          name="username"
          autoComplete="username"
          className="border px-2 py-1 rounded-md"
          placeholder="username"
        />
      </div>

      {result?.error && <div className="text-red-500">{result.message}</div>}

      <Button htmlType="submit" className="bg-orange-400 text-white">
        Login
      </Button>
      <Button as={Link} to="/forgot-password">
        New device
      </Button>
    </form>
  );
}
