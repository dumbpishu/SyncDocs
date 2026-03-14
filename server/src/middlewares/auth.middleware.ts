import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const authMiddleware = async (req: any, res: any, next: any) => {
    console.log("Auth middleware called");
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);

        const user = await User.findById(decoded?.id);

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}