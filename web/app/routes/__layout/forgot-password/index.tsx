import { Button } from "~/components/Button";
import { Form, useActionData } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/cloudflare";
import { failure, success } from "~/helpers/result";

export async function action({ request, context }: ActionArgs) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const username = formData.get("username")?.toString();
  if (!username) {
    return failure({ message: "Missing form data" });
  }
  const id = context.DO_USER.idFromName(username);
  const stub = context.DO_USER.get(id);

  await stub.fetch(`${url.origin}/forgot-password`);

  return success({ message: "An email has been sent to this user's address" });
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
          className="border px-2 py-1 rounded-md"
          placeholder="username"
        />
      </div>
      <div className="text-red-500">
        {result?.success === false && result.message}
      </div>
      <div className="text-black">
        {result?.success === true && result.message}
      </div>
      <Button htmlType="submit" className="bg-orange-400 text-white">
        Send email
      </Button>
    </Form>
  );
}
