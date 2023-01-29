import { Button } from "~/components/Button";
import { Form, useActionData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/cloudflare";
import { bad, good } from "~/helpers/result";
import { client } from "dumb-durable-object";
import { readForm } from "~/helpers/form";

export async function action({ request, context }: ActionArgs) {
  const [form, error] = await readForm(request, ["username"]);
  if (error) {
    return bad({ message: "Missing form data" });
  }
  console.log(context);

  const c = client(request, context.DO_USER, form.username);

  const [value, err] = await c.forgotPassword();

  if (!err) {
    console.log(value);
  }

  return good({
    message: "An email has been sent to this user's address",
  });
}

export default function ForgotPassword() {
  const result = useActionData<typeof action>();

  return (
    <Form method="post" className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label>Username</label>
        <input
          required
          name="username"
          autoComplete="username"
          className="rounded-md border px-2 py-1"
          placeholder="username"
        />
      </div>

      {result?.[1] && <div className="text-red-500">{result[1].message}</div>}
      {result?.[0] && <div className="text-black">{result[0].message}</div>}
      <Button type="submit" className="bg-orange-400 text-white">
        Send email
      </Button>
    </Form>
  );
}
