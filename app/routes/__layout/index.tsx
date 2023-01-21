import type { LoaderArgs } from "@remix-run/cloudflare";
import { cookieSession } from "~/helpers/auth";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/Button";

export async function loader({ request, context }: LoaderArgs) {
  const { user } = await cookieSession(request, context);

  return user;
}

export default function Index() {
  const user = useLoaderData<typeof loader>();
  return (
    <>
      {user ? (
        <div className="flex flex-col">
          <Button as={Link} to="logout">
            Logout
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button as={Link} to="/login">
            Login
          </Button>
          <Button as={Link} to="/sign-up" className="bg-orange-400 text-white">
            Sign up
          </Button>
        </div>
      )}
    </>
  );
}
