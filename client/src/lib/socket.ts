import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true });
  }
  return socket;
};
