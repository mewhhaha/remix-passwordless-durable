const HOUR_IN_MILLISECONDS = 3600000;
const KEY_DATA = "data";
const KEY_REGISTER = "register";
const KEY_VERIFIED = "verified";

export type UserData = {
  email: string;
  username: string;
  displayname: string;
};

export type UserRegister = {
  secret: string;
  expiresAt: Date;
};

export class DurableObjectUser implements DurableObject {
  id: DurableObjectId;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.storage = state.storage;
    this.id = state.id;
  }

  async fetch(request: Request) {
    const { storage } = this;
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/verified": {
        const verified = await storage.get<boolean>(KEY_VERIFIED);

        return json({ verified: verified === true });
      }

      case "/register": {
        const r = await storage.get<UserRegister>(KEY_REGISTER);
        if (r === undefined) {
          return forbidden();
        }

        const attempt = await request.text();

        if (attempt !== r.secret || r.expiresAt <= new Date()) {
          return forbidden();
        }

        await storage.delete(KEY_REGISTER);
        await storage.put(KEY_VERIFIED, true);
        const data = await storage.get(KEY_DATA);
        return json(data);
      }

      case "/forgot-password": {
        const data = await storage.get<UserData>(KEY_DATA);
        if (data === undefined) {
          return forbidden();
        }

        const { link, secret } = generateLink(data.username, url.origin);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + HOUR_IN_MILLISECONDS);
        storage.put(KEY_REGISTER, { secret, expiresAt });

        const response = await fetch(
          "https://api.mailchannels.net/tx/v1/send",
          {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(generateEmail(data.email, link, expiresAt)),
          }
        );

        if (response.ok) {
          return ok();
        }

        return forbidden();
      }

      case "/set": {
        const data = await request.json<UserData>();
        await Promise.all([
          storage.put(KEY_DATA, data),
          storage.put(KEY_VERIFIED, false),
          storage.delete(KEY_REGISTER),
        ]);

        return ok();
      }
    }

    return missing();
  }
}
export default {
  async fetch() {
    return forbidden();
  },
};

const missing = () => new Response(null, { status: 404 });
const ok = () => new Response(null, { status: 200 });
const forbidden = () => new Response(null, { status: 403 });
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const generateLink = (username: string, origin: string) => {
  const randomValues = new Uint8Array(102);
  const secret = encodeURIComponent(
    crypto.getRandomValues(randomValues).toString()
  );
  const url = new URL(origin);

  url.pathname = `/register/${username}`;
  url.searchParams.set("s", secret);
  return { link: url.toString(), secret };
};

const generateEmail = (email: string, link: string, expiresAt: Date) => {
  return {
    personalizations: [
      {
        to: [{ email, name: "Human" }],
      },
    ],
    from: {
      email: "no-reply@jkot.me",
      name: "remix-passwordless-durable",
    },
    headers: {
      Date: new Date().toDateString(),
    },
    subject: "Set up passwordless login",
    content: [
      {
        type: "text/html",
        value: `Set up passwordless login for your device <a href="${link}" target="_blank">here</a>. It expires at ${expiresAt.toLocaleTimeString()}.`,
      },
    ],
  };
};
