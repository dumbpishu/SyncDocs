import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route";
import documentRoutes from "./routes/document.route";
import { sendErrorResponse, sendSuccessResponse } from "./utils/apiResponse";

const corsOptions = {
    origin: ["http://localhost:5173"],
    credentials: true
};

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors(corsOptions));
app.use(cookieParser());

app.get("/health", (_req, res) => {
    return sendSuccessResponse(res, {
        message: "Server is healthy",
        data: { status: "ok" }
    });
});

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);

app.use((_req, res) => {
    return sendErrorResponse(res, {
        statusCode: 404,
        message: "Route not found"
    });
});

export default app;
