import type { LoaderArgs } from "@remix-run/cloudflare";
import { cookieSession } from "~/helpers/auth";
import { Link, useLoaderData } from "@remix-run/react";
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
          <pre>{JSON.stringify(result.credentials, undefined, 2)}</pre>
        </div>
      )}
    </>
  );
}
