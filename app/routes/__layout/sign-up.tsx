import { Client } from "@passwordlessdev/passwordless-client";
import type { ActionArgs, LoaderArgs } from "@remix-run/cloudflare";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { useEffect } from "react";
import { Button } from "~/components/Button";

export async function loader({ context }: LoaderArgs) {
  return { apiKey: context.AUTH_PUBLIC, apiUrl: context.AUTH_API };
}

export async function action({
  request,
  context,
}: ActionArgs): Promise<
  | { success: true; token: string; username: string }
  | { success: false; message: string }
> {
  const formData = await request.formData();
  const username = formData.get("username")?.toString();
  const displayname = formData.get("displayname")?.toString();
  const userId = crypto.randomUUID();

  if (!username || !displayname) {
    return {
      success: false,
      message: "Missing form data",
    } as const;
  }

  const payload = {
    userId,
    username: username,
    displayname,
    aliases: [username],
  };

  try {
    const response = await fetch(`${context.AUTH_API}/register/token`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        ApiSecret: context.AUTH_SECRET,
        "Content-Type": "application/json",
      },
    });

    if (response.status == 409) {
      return {
        success: false,
        message:
          "Ooops! Alias is already in use by another user. Please choose a unique alias",
      };
    }

    const token = await response.text();
    return { success: true, token, username };
  } catch (err) {
    if (err instanceof Error) return { success: false, message: err.message };
    return { success: false, message: "" };
  }
}

export default function SignUp() {
  const clientConfig = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.success !== true) return;

    const f = async () => {
      const client = new Client(clientConfig);
      await client.register(actionData.token, actionData.username);
      navigate("/");
    };

    f();
  }, [actionData, clientConfig, navigate]);

  return (
    <Form method="post" className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label>Username</label>
        <input
          required
          name="username"
          className="border px-2 py-1 rounded-md"
          placeholder="username"
        />
      </div>

      <div className="flex flex-col">
        <label>Display name</label>
        <input
          required
          name="displayname"
          className="border px-2 py-1 rounded-md"
          placeholder="displayname"
        />
      </div>

      <div className="text-red-500">
        {actionData?.success === false && actionData.message}
      </div>
      <Button className="bg-orange-400 text-white">Sign up</Button>
    </Form>
  );
}
