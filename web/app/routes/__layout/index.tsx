import type { LoaderArgs } from "@remix-run/cloudflare";
import { cookieSession } from "~/helpers/auth";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/Button";
import { failure, success } from "~/helpers/result";
import { credentialsList } from "~/helpers/passwordless";

export async function loader({ request, context }: LoaderArgs) {
  const { user } = await cookieSession(request, context);

  if (user) {
    const payload = {
      userId: user.userId,
    };

    const credentials = await credentialsList(context, payload);

    return success({ user, credentials });
  }

  return failure({});
}

export default function Index() {
  const result = useLoaderData<typeof loader>();
  return (
    <>
      {result.error ? (
        <div className="flex flex-col gap-4">
          <Button as={Link} to="/login">
            Login
          </Button>
          <Button as={Link} to="/sign-up" className="bg-orange-400 text-white">
            Sign up
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          <Button as={Link} to="logout">
            Logout
          </Button>
          <ul>
            {result.credentials.map(
              ({ createdAt, lastUsedAt, device, descriptor: { id } }) => {
                return (
                  <li key={id} className="rounded-md border">
                    <Form>
                      <dl className="grid grid-cols-2 gap-4">
                        <dt className="font-bold">Created at</dt>
                        <dd>{createdAt}</dd>
                        <dt className="font-bold">Last used at</dt>
                        <dd>{lastUsedAt}</dd>
                        <dt className="font-bold">Device</dt>
                        <dd>{device}</dd>
                        <dt className="font-bold">Credential id</dt>
                        <dd>{id}</dd>
                      </dl>
                      <Button>Delete</Button>
                    </Form>
                  </li>
                );
              }
            )}
          </ul>
        </div>
      )}
    </>
  );
}
