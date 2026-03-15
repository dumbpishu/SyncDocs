import crypto from "crypto";
import { User } from "../models/user.model";

const generateRandomUsername = () => {
    const hash = crypto.randomBytes(4).toString("hex");
    return `u_${hash}`;
};

export const createUniqueUsername = async () => {
    let username = generateRandomUsername();

    while (await User.exists({ username })) {
        username = generateRandomUsername();
    }

    return username;
};
