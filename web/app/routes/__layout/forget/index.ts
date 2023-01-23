import type { ActionArgs } from "@remix-run/cloudflare";
import { cookieSession } from "~/helpers/auth";
import { readForm } from "~/helpers/form";
import { credentialsDelete, credentialsList } from "~/helpers/passwordless";
import { failure, success } from "~/helpers/result";

export async function action({ request, context }: ActionArgs) {
  const { user } = await cookieSession(request, context);
  if (user === null) {
    return failure({ message: "Not logged in" });
  }
  const { error, credentialId } = await readForm(request, ["credentialId"]);
  if (error) {
    return failure({ message: "Missing form data" });
  }

  const credentials = await credentialsList(context, { userId: user.userId });

  if (credentials.every((c) => c.descriptor.id !== credentialId)) {
    return failure({ message: "No access to credential id" });
  }

  await credentialsDelete(context, { CredentialId: credentialId });

  return success({
    message: "Successfully deleted",
  });
}
