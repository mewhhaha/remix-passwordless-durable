import type { ActionArgs } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { Button } from "~/components/Button";
import type { UserData } from "user";
import { failure, success } from "~/helpers/result";
import { client } from "dumbo-rpc";

export async function action({ request, context }: ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const username = formData.get("username")?.toString();
  const displayname = formData.get("displayname")?.toString();

  if (!username || !displayname || !email) {
    return failure({ message: "Missing form data" });
  }

  const c = client(request, context.DO_USER, username);
  const { value: verified } = await c.verified();
  if (verified) {
    return failure({
      message: "Ooops! User is already signed up!",
    });
  }

  const payload = {
    userId: c.stub.id.toString(),
    username,
    displayname,
    aliases: [username, email],
  };

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

  const data: UserData = {
    email,
    username,
    displayname,
  };

  await c.initialize(data);
  await c.forgotPassword();

  return success({ username, email });
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
        <label>Email</label>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          className="border px-2 py-1 rounded-md"
          placeholder="email@com"
        />
      </div>

      <div className="flex flex-col">
        <label>Username</label>
        <input
          required
          autoComplete="username"
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
          autoComplete="nickname"
          className="border px-2 py-1 rounded-md"
          placeholder="displayname"
        />
      </div>

      {result?.success === false && (
        <div className="text-red-500">{result.message}</div>
      )}

      <Button className="bg-orange-400 text-white">Sign up</Button>
    </Form>
  );
}
