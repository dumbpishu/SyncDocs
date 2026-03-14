import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const corsOptions = {
    origin: ["http://localhost:5173"],
    credentials: true
}

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

import authRoutes from "./routes/auth.route";
import documentRoutes from "./routes/document.route";

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);


export default app;