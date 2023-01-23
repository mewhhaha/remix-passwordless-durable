import type { ActionArgs } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { Button } from "~/components/Button";
import type { UserData } from "user";
import { failure, success } from "~/helpers/result";
import { client } from "dumb-durable-object";
import { readForm } from "~/helpers/form";

export async function action({ request, context }: ActionArgs) {
  const { error, username, displayname, email } = await readForm(request, [
    "email",
    "username",
    "displayname",
  ]);

  if (error) {
    return failure({ message: "Missing form data" });
  }

  const c = client(request, context.DO_USER, username);
  const { value: verified } = await c.verified();
  if (verified) {
    return failure({
      message: "Ooops! User is already signed up!",
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

  return result === undefined || result.error ? (
    <Form method="post" className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label>Email</label>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          className="rounded-md border px-2 py-1"
          placeholder="email@com"
        />
      </div>

      <div className="flex flex-col">
        <label>Username</label>
        <input
          required
          autoComplete="username"
          name="username"
          className="rounded-md border px-2 py-1"
          placeholder="username"
        />
      </div>

      <div className="flex flex-col">
        <label>Display name</label>
        <input
          required
          name="displayname"
          autoComplete="nickname"
          className="rounded-md border px-2 py-1"
          placeholder="displayname"
        />
      </div>

      {result?.error && <div className="text-red-500">{result.message}</div>}

      <Button className="bg-orange-400 text-white">Sign up</Button>
    </Form>
  ) : (
    <div>
      An email have been sent to <strong>{result.email}</strong> with a link to
      set up your credentials
    </div>
  );
}
