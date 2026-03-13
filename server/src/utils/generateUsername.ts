import crypto from "crypto";
import { User } from "../models/user.model";

const generateHashUsername = () => {
  const hash = crypto.randomBytes(4).toString("hex");
  return `u_${hash}`;
};

export const createUniqueUsername = async () => {
  let username;

  while (true) {
    username = generateHashUsername();

    const exists = await User.exists({ username });

    if (!exists) break;
  }

  return username;
};