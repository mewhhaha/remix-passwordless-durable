import { CallableDurableObject, error, respond } from "dumbo-rpc";

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

export class DurableObjectUser extends CallableDurableObject {
  async verified(_: Request) {
    const { storage } = this.state;
    const verified = await storage.get<boolean>(KEY_VERIFIED);
    return respond(verified === true);
  }

  async register(_: Request, code: string) {
    const { storage } = this.state;
    const r = await storage.get<UserRegister>(KEY_REGISTER);
    if (r === undefined) {
      return error(403, "No register request");
    }

    if (code !== r.secret || r.expiresAt <= new Date()) {
      return error(403, "Either invalid code or expires");
    }

    await storage.delete(KEY_REGISTER);
    await storage.put(KEY_VERIFIED, true);
    const data = await storage.get<UserData>(KEY_DATA);
    return respond(data);
  }

  async forgotPassword(request: Request) {
    const { storage } = this.state;
    const url = new URL(request.url);
    const data = await storage.get<UserData>(KEY_DATA);
    if (data === undefined) {
      return error(404, "This account doesn't exist");
    }

    const { link, secret } = generateLink(data.username, url.origin);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOUR_IN_MILLISECONDS);
    await storage.put(KEY_REGISTER, { secret, expiresAt });

    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(generateEmail(data.email, link, expiresAt)),
    });

    if (!response.ok) {
      error(500, "Was unable to send the email");
    }

    return respond("ok");
  }

  async initialize(_: Request, data: UserData) {
    const { storage } = this.state;
    const verified = await storage.get<boolean>(KEY_VERIFIED);
    if (verified) {
      return error(403, "Username already taken");
    }

    await Promise.all([
      storage.put(KEY_DATA, data),
      storage.put(KEY_VERIFIED, false),
      storage.delete(KEY_REGISTER),
    ]);

    return respond("ok");
  }
}

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

export default {
  async fetch() {
    return new Response(null, { status: 403 });
  },
};
