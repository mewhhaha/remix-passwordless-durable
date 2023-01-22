import { Button } from "~/components/Button";
import { Form, useActionData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/cloudflare";
import { failure, success } from "~/helpers/result";
import { client } from "dumbo-rpc";

export async function action({ request, context }: ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username")?.toString();
  if (!username) {
    return failure({ message: "Missing form data" });
  }

  const c = client(request, context.DO_USER, username);

  await c.forgotPassword();

  return success({
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
          className="border px-2 py-1 rounded-md"
          placeholder="username"
        />
      </div>

      {result?.success === false && (
        <div className="text-red-500">{result.message}</div>
      )}
      {result?.success === true && (
        <div className="text-black">{result.message}</div>
      )}
      <Button htmlType="submit" className="bg-orange-400 text-white">
        Send email
      </Button>
    </Form>
  );
}
