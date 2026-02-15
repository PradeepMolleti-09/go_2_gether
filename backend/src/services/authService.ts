import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { User } from "../models/User";

const googleClient = new OAuth2Client(env.googleClientId);

export const verifyGoogleToken = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google token");
  }

  const user = await User.findOneAndUpdate(
    { googleId: payload.sub },
    {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      avatarUrl: payload.picture,
    },
    { new: true, upsert: true }
  );

  const token = jwt.sign({ id: user.id }, env.jwtSecret, {
    expiresIn: "7d",
  });

  return { user, token };
};

