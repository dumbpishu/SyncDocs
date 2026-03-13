import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";

const corsOptions = {
    origin: ["http://localhost:5173"],
    withCredentials: true,
}

const app = express();

app.use(express.json());
app.use(cors(corsOptions));


app.use("/auth", authRoutes);


export default app;