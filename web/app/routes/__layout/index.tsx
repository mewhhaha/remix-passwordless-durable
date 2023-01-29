import type { ActionArgs } from "@remix-run/cloudflare";
import { type LoaderArgs } from "@remix-run/cloudflare";
import { cookieSession } from "~/helpers/auth";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/Button";
import { bad, good } from "~/helpers/result";
import type { User } from "~/helpers/passwordless";
import { credentialsDelete } from "~/helpers/passwordless";
import { credentialsList, type Credential } from "~/helpers/passwordless";
import { useHydrated } from "~/helpers/react";
import { readForm } from "~/helpers/form";

export async function loader({ request, context }: LoaderArgs) {
  const { user } = await cookieSession(request, context);
  if (!user) {
    return bad();
  }

  const payload = {
    userId: user.userId,
  };

  const credentials = await credentialsList(context, payload);

  return good({ user, credentials });
}

export async function action({ request, context }: ActionArgs) {
  const { user } = await cookieSession(request, context);
  if (user === null) {
    return bad({ message: "Not logged in" });
  }
  const [form, error] = await readForm(request, ["credentialId"]);
  if (error) {
    return bad({ message: "Missing form data" });
  }

  const payload = {
    userId: user.userId,
  };

  const credentials = await credentialsList(context, payload);

  if (credentials.every((c) => c.descriptor.id !== form.credentialId)) {
    return bad({ message: "No access to credential id" });
  }

  const result = await credentialsDelete(context, {
    userId: user.userId,
    CredentialId: form.credentialId,
  });
  console.log(result);

  return good({
    message: "Successfully deleted",
  });
}

export default function Index() {
  const [profile, unauthenticated] = useLoaderData<typeof loader>();

  return (
    <>
      {unauthenticated ? (
        <div className="flex flex-col gap-4">
          <Button as={Link} to="/login">
            Login
          </Button>
          <Button as={Link} to="/sign-up" className="bg-orange-400 text-white">
            Sign up
          </Button>
        </div>
      ) : (
        <Dashboard user={profile.user} credentials={profile.credentials} />
      )}
    </>
  );
}

type DashboardProps = {
  user: User;
  credentials: Credential[];
};

export const Dashboard = ({ credentials }: DashboardProps) => {
  const hydrated = useHydrated();

  return (
    <div className="flex flex-col">
      <Button as={Link} to="logout" className="mb-6">
        Logout
      </Button>
      <ul className="space-y-4">
        {credentials.map(
          ({ createdAt, lastUsedAt, device, descriptor: { id } }) => {
            return (
              <li key={id} className="rounded-md border p-4">
                <Form method="post">
                  <input name="credentialId" type="hidden" value={id} />
                  <dl className="mb-4 grid grid-cols-2 gap-4">
                    <dt className="font-bold">Created at</dt>
                    <dd>{hydrated && new Date(createdAt).toLocaleString()}</dd>
                    <dt className="font-bold">Last used at</dt>
                    <dd>{hydrated && new Date(lastUsedAt).toLocaleString()}</dd>
                    <dt className="font-bold">Device</dt>
                    <dd>{device}</dd>
                  </dl>
                  <Button type="submit">Delete</Button>
                </Form>
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
};
