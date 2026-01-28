import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = new Map();

const countriesData = {
  europe: [
    ["Albánie",41.32,19.81,["albania"]],["Rakousko",48.20,16.37,["austria"]],
    ["Belgie",50.85,4.35,["belgium"]],["Bulharsko",42.69,23.32,["bulgaria"]],
    ["Chorvatsko",45.81,15.98,["croatia"]],["Česko",50.07,14.43,["czech","cesko"]],
    ["Dánsko",55.67,12.56,["denmark"]],["Estonsko",59.43,24.75,["estonia"]],
    ["Finsko",60.16,24.93,["finland"]],["Francie",48.85,2.35,["france"]],
    ["Německo",52.52,13.40,["germany"]],["Řecko",37.98,23.72,["greece"]],
    ["Maďarsko",47.49,19.04,["hungary"]],["Island",64.14,-21.94,["iceland"]],
    ["Irsko",53.34,-6.26,["ireland"]],["Itálie",41.90,12.49,["italy"]],
    ["Litva",54.68,25.27,["lithuania"]],["Nizozemsko",52.36,4.90,["netherlands"]],
    ["Norsko",59.91,10.75,["norway"]],["Polsko",52.22,21.01,["poland"]],
    ["Portugalsko",38.72,-9.13,["portugal"]],["Rumunsko",44.42,26.10,["romania"]],
    ["Rusko",55.75,37.61,["russia"]],["Slovensko",48.14,17.10,["slovakia"]],
    ["Slovinsko",46.05,14.50,["slovenia"]],["Španělsko",40.41,-3.70,["spain"]],
    ["Švédsko",59.32,18.06,["sweden"]],["Švýcarsko",46.94,7.44,["switzerland"]],
    ["Ukrajina",50.45,30.52,["ukraine"]],["Velká Británie",51.50,-0.12,["britain","uk"]]
  ],
  asia: [
    ["Afghánistán",34.52,69.17,["afghanistan"]],["Bangladéš",23.81,90.41,["bangladesh"]],
    ["Čína",39.90,116.41,["china"]],["Indie",28.61,77.20,["india"]],
    ["Indonésie",-6.20,106.84,["indonesia"]],["Irán",35.68,51.38,["iran"]],
    ["Irák",33.31,44.36,["iraq"]],["Izrael",31.76,35.21,["israel"]],
    ["Japonsko",35.67,139.65,["japan"]],["Jordánsko",31.94,35.92,["jordan"]],
    ["Kazachstán",51.16,71.42,["kazakhstan"]],["Malajsie",3.13,101.68,["malaysia"]],
    ["Pákistán",33.68,73.04,["pakistan"]],["Filipíny",14.59,120.98,["philippines"]],
    ["Saúdská Arábie",24.71,46.67,["saudi"]],["Singapur",1.35,103.81,["singapore"]],
    ["Jižní Korea",37.56,126.97,["korea"]],["Thajsko",13.75,100.50,["thailand"]],
    ["Turecko",39.93,32.85,["turkey"]],["Vietnam",21.02,105.83,["vietnam"]]
  ],
  americas: [
    ["Argentina",-34.60,-58.38,["argentyna"]],["Brazílie",-15.79,-47.88,["brazil"]],
    ["Kanada",45.42,-75.69,["canada"]],["Chile",-33.44,-70.66,["chile"]],
    ["Kolumbie",4.71,-74.07,["colombia"]],["Kuba",23.11,-82.36,["cuba"]],
    ["Mexiko",19.43,-99.13,["mexico"]],["Peru",-12.04,-77.04,["peru"]],
    ["USA",38.90,-77.03,["usa"]]
  ],
  africa: [
    ["Alžírsko",28.03,1.65,["algeria"]],["Egypt",30.04,31.23,["egypt"]],
    ["Keňa",-1.29,36.82,["kenya"]],["Maroko",34.02,-6.84,["morocco"]],
    ["Jižní Afrika",-25.74,28.22,["africa"]],["Tunisko",36.80,10.18,["tunisia"]]
  ],
  oceania: [
    ["Austrálie",-35.28,149.13,["australia"]],["Nový Zéland",-41.28,174.77,["zealand"]]
  ]
};

countriesData.world = [
  ...countriesData.europe, ...countriesData.asia,
  ...countriesData.americas, ...countriesData.africa, ...countriesData.oceania
];

function getCountry(continent = 'world') {
  const list = countriesData[continent] || countriesData.world;
  return list[Math.floor(Math.random() * list.length)];
}

io.on("connection", socket => {
  console.log("Připojen:", socket.id);
  let currentRoom = null;
  let playerRole = null;

  socket.on("create-room", (continent) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    currentRoom = code;
    playerRole = "host";
    
    rooms.set(code, {
      host: socket.id,
      guest: null,
      gameState: {
        round: 1,
        hostScore: 0,
        guestScore: 0,
        currentCountry: null,
        finished: false,
        hostOut: false,
        guestOut: false,
        continent: continent || 'world',
        started: false
      },
      chat: []
    });
    
    socket.join(code);
    socket.emit("room-created", { code, continent });
  });

  socket.on("join-room", (code) => {
    code = code.toUpperCase();
    const room = rooms.get(code);
    
    if (!room) {
      socket.emit("join-error", "Místnost neexistuje");
      return;
    }
    if (room.guest) {
      socket.emit("join-error", "Místnost je plná");
      return;
    }
    
    currentRoom = code;
    playerRole = "guest";
    room.guest = socket.id;
    
    socket.join(code);
    socket.emit("joined-room", { code, continent: room.gameState.continent });
    io.to(room.host).emit("guest-joined", { message: "Soupeř se připojil!" });
  });

  socket.on("chat-message", (message) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    const sender = playerRole === "host" ? "Host" : "Soupeř";
    const msgData = {
      sender: sender,
      text: message,
      time: new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'})
    };
    
    room.chat.push(msgData);
    io.to(currentRoom).emit("new-chat-message", msgData);
  });

  socket.on("start-game", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    if (playerRole !== "host") return;
    
    room.gameState.started = true;
    io.to(currentRoom).emit("game-started");
    startNewRound(currentRoom);
  });

  socket.on("correct-guess", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.gameState.finished || !room.gameState.started) return;
    
    room.gameState.finished = true;
    const winner = playerRole;
    
    if (winner === "host") room.gameState.hostScore++;
    else room.gameState.guestScore++;
    
    broadcastResult(room, winner);
  });

  socket.on("out-of-attempts", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.gameState.finished || !room.gameState.started) return;
    
    if (playerRole === "host") room.gameState.hostOut = true;
    else room.gameState.guestOut = true;
    
    if (room.gameState.hostOut && room.gameState.guestOut) {
      room.gameState.finished = true;
      broadcastResult(room, "draw");
    } else {
      const other = playerRole === "host" ? room.guest : room.host;
      io.to(other).emit("opponent-out");
    }
  });

  socket.on("request-rematch", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    // Reset herního stavu
    room.gameState.round = 1;
    room.gameState.hostScore = 0;
    room.gameState.guestScore = 0;
    room.gameState.finished = false;
    room.gameState.hostOut = false;
    room.gameState.guestOut = false;
    room.gameState.started = false;
    room.chat = []; // Vyčistit chat pro novou hru
    
    io.to(currentRoom).emit("rematch-started");
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      const other = playerRole === "host" ? room.guest : room.host;
      if (other) io.to(other).emit("opponent-left");
      rooms.delete(currentRoom);
    }
  });

  function startNewRound(code) {
    const room = rooms.get(code);
    if (!room) return;
    
    if (room.gameState.round > 5) {
      endGame(room);
      return;
    }
    
    const country = getCountry(room.gameState.continent);
    room.gameState.currentCountry = country;
    room.gameState.finished = false;
    room.gameState.hostOut = false;
    room.gameState.guestOut = false;
    
    io.to(code).emit("new-round", {
      round: room.gameState.round,
      country: country,
      hostScore: room.gameState.hostScore,
      guestScore: room.gameState.guestScore
    });
  }

  function broadcastResult(room, winner) {
    const isFinal = room.gameState.round >= 5;
    
    io.to(room.host).emit("round-result", {
      winner,
      isHost: true,
      countryName: room.gameState.currentCountry[0],
      hostScore: room.gameState.hostScore,
      guestScore: room.gameState.guestScore,
      isFinal
    });
    
    io.to(room.guest).emit("round-result", {
      winner,
      isHost: false,
      countryName: room.gameState.currentCountry[0],
      hostScore: room.gameState.hostScore,
      guestScore: room.gameState.guestScore,
      isFinal
    });
    
    if (!isFinal) {
      room.gameState.round++;
      setTimeout(() => startNewRound(currentRoom), 5000);
    } else {
      setTimeout(() => endGame(room), 5000);
    }
  }

  function endGame(room) {
    let gameWinner;
    if (room.gameState.hostScore > room.gameState.guestScore) gameWinner = "host";
    else if (room.gameState.hostScore < room.gameState.guestScore) gameWinner = "guest";
    else gameWinner = "draw";
    
    io.to(room.host).emit("game-over", {
      winner: gameWinner,
      isHost: true,
      hostScore: room.gameState.hostScore,
      guestScore: room.gameState.guestScore
    });
    
    io.to(room.guest).emit("game-over", {
      winner: gameWinner,
      isHost: false,
      hostScore: room.gameState.hostScore,
      guestScore: room.gameState.guestScore
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server běží na portu", PORT);
});
