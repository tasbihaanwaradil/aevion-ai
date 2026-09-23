import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../configs/Config";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(BASE_URL, { withCredentials: true });
  }
  return socket;
};