import type { ActionArgs } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { Button } from "~/components/Button";
import type { UserData } from "user";
import { failure, success } from "~/helpers/result";

export async function action({ request, context }: ActionArgs) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const username = formData.get("username")?.toString();
  const displayname = formData.get("displayname")?.toString();

  if (!username || !displayname || !email) {
    return failure({ message: "Missing form data" });
  }

  const id = context.DO_USER.idFromName(username);
  const stub = context.DO_USER.get(id);

  const payload = {
    userId: id,
    username,
    displayname,
    aliases: [username, email],
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
      return failure({
        message:
          "Ooops! Alias is already in use by another user. Please choose a unique alias",
      });
    }
    const token = await response.text();

    const data: UserData = {
      email,
      username,
      token,
    };

    await stub.fetch(`${url.origin}/set`, {
      body: JSON.stringify(data),
    });
    await stub.fetch(`${url.origin}/forgot-password`);

    return success({ username, email });
  } catch (err) {
    if (err instanceof Error) return failure({ message: err.message });
    return failure({ message: "" });
  }
}

export default function SignUp() {
  const result = useActionData<typeof action>();

  return result?.success ? (
    <div>
      An email have been sent to <strong>{result.email}</strong> with a link to
      set up your credentials
    </div>
  ) : (
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
        {result?.success === false && result.message}
      </div>
      <Button className="bg-orange-400 text-white">Sign up</Button>
    </Form>
  );
}
