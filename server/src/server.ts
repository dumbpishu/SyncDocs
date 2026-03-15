import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { registerCollaborationServer } from "./realtime/collaboration";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        await connectDB();
        const httpServer = createServer(app);
        registerCollaborationServer(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
};

startServer();
