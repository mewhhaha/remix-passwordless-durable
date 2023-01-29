import type { LoaderArgs } from "@remix-run/cloudflare";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import type { ComponentProps } from "react";
import { cookieSession } from "~/helpers/auth";
import { bad, good } from "~/helpers/result";

export async function loader({ request, context }: LoaderArgs) {
  const { user } = await cookieSession(request, context);

  if (user) {
    return good(user);
  }

  return bad();
}

export default function Layout() {
  const [user, unauthenticated] = useLoaderData<typeof loader>();
  return (
    <>
      <header className="relative h-16 w-full border-b pt-1">
        <div className="mb-1 text-center text-xl">
          <a
            href="https://github.com/mewhhaha/remix-passwordless-durable"
            className="absolute left-[1rem] top-[0.5rem]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          {!unauthenticated ? user.nickname : "Who are you?"}
        </div>
        <nav className="flex gap-4 px-4">
          <HeaderNavLink to="/">home</HeaderNavLink>
          {unauthenticated ? (
            <>
              <HeaderNavLink to="/login">login</HeaderNavLink>
              <HeaderNavLink to="/sign-up">sign up</HeaderNavLink>
              <HeaderNavLink to="/forgot-password">
                forgot password
              </HeaderNavLink>
            </>
          ) : (
            <HeaderNavLink to="/logout">logout</HeaderNavLink>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-md px-4 pt-4">
        <Outlet />
      </main>
    </>
  );
}
type HeaderNavLinkProps = ComponentProps<typeof NavLink>;

const HeaderNavLink = ({
  children,
  className,
  ...props
}: HeaderNavLinkProps) => {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        [
          isActive ? "text-black" : "text-blue-700 hover:underline",
          className ?? "",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
};
