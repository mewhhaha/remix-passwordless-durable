const HOUR_IN_MILLISECONDS = 3600000;

export type UserData = {
  token: string;
  email: string;
  username: string;
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
      case "/register": {
        const r = await storage.get<UserRegister>("register");
        if (r === undefined) {
          return forbidden();
        }

        const attempt = await request.text();

        if (attempt !== r.secret || r.expiresAt <= new Date()) {
          return forbidden();
        }

        await storage.delete("register");
        const data = await storage.get("data");
        return json(data);
      }

      case "/forgot_password": {
        const data = await storage.get<UserData>("email");
        if (data === undefined) {
          return forbidden();
        }

        const { link, secret } = generateLink(data.username, url.origin);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + HOUR_IN_MILLISECONDS);
        storage.put("register", { secret, expiresAt });

        await fetch("https://api.mailchannels.net/tx/v1/send", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(generateEmail(data.email, link)),
        });

        return ok();
      }

      case "/set": {
        const data = await request.json<UserData>();
        await storage.put("data", data);
        await storage.delete("register");
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

  url.pathname = `/register/${username}?s=${secret}`;
  return { link: url.toString(), secret };
};

const generateEmail = (email: string, link: string) => {
  return {
    personalizations: [
      {
        to: [{ email }],
      },
    ],
    from: {
      email: "no-reply@example.com",
      name: "remix-passwordless-durable",
    },
    subject: "Set up passwordless login",
    content: [
      {
        type: "text/html",
        value: `Set up passwordless login for your device <a href="${link}" target="_blank">here</a>`,
      },
    ],
  };
};
