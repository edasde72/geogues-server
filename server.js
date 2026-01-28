import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

io.on("connection", socket => {
  console.log("Připojen:", socket.id);

  socket.on("create-room", () => {
    const code = Math.random().toString(36).substring(2, 7);
    socket.join(code);
    socket.emit("room-created", code);
  });
});

server.listen(PORT, () => {
  console.log("Server běží na portu", PORT);
});
