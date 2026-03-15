import { io } from "socket.io-client";

let collaborationSocket: ReturnType<typeof io> | null = null;

export const getCollaborationSocket = () => {
  if (!collaborationSocket) {
    collaborationSocket = io(import.meta.env.VITE_API_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }

  return collaborationSocket;
};
