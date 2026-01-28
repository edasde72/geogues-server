// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// BEZPEČNOST: Statické soubory pouze z public složky (nesdílíme zdrojáky)
app.use(express.static(path.join(__dirname, 'public')));

// BEZPEČNOST: CORS omezený na konkrétní originy
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

// BEZPEČNOST: Rate limiting pro HTTP
const requestCounts = new Map();
setInterval(() => requestCounts.clear(), 60000); // Reset každou minutu

app.use((req, res, next) => {
  const ip = req.ip;
  const count = requestCounts.get(ip) || 0;
  if (count > 100) return res.status(429).json({ error: 'Too many requests' });
  requestCounts.set(ip, count + 1);
  
  // BEZPEČNOST: Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    credentials: true 
  },
  // BEZPEČNOST: Limits pro prevenci DoS
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000
});

// Datový model zemí (single source of truth)
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
  ...countriesData.europe,
  ...countriesData.asia,
  ...countriesData.americas,
  ...countriesData.africa,
  ...countriesData.oceania
];

// Validace a sanitizace
const MAX_MESSAGE_LENGTH = 200;
const MAX_ROOM_CODE_LENGTH = 10;
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.slice(0, MAX_MESSAGE_LENGTH).replace(/[<>]/g, '');
};

const validateContinent = (c) => ['world','europe','asia','americas','africa','oceania'].includes(c) ? c : 'world';

// Správa místností s cleanup
const rooms = new Map();
const socketRooms = new Map(); // Map<socketId, roomCode>

// Cleanup prázdných místností každých 5 minut
setInterval(() => {
  for (const [code, room] of rooms.entries()) {
    const hostActive = io.sockets.sockets.get(room.host);
    const guestActive = room.guest ? io.sockets.sockets.get(room.guest) : false;
    
    if (!hostActive && !guestActive) {
      rooms.delete(code);
      console.log(`Cleaned up room ${code}`);
    }
  }
}, 300000);

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // Bezpečnější než Math.random
}

function getRandomCountry(continent = 'world') {
  const list = countriesData[continent] || countriesData.world;
  return list[Math.floor(Math.random() * list.length)];
}

// Rate limiter pro socket events
const socketRateLimits = new Map();
function checkRateLimit(socketId, event, limit = 10, window = 10000) {
  const key = `${socketId}:${event}`;
  const now = Date.now();
  const entry = socketRateLimits.get(key) || { count: 0, resetTime: now + window };
  
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + window;
  }
  
  if (entry.count >= limit) return false;
  entry.count++;
  socketRateLimits.set(key, entry);
  return true;
}

io.on("connection", socket => {
  console.log("Connected:", socket.id);
  
  // Odeslat seznam zemí klientovi (eliminace duplicity)
  socket.emit('init-data', { countries: countriesData });

  socket.on("create-room", (continent = 'world') => {
    if (!checkRateLimit(socket.id, 'create-room', 3, 60000)) {
      return socket.emit('error', 'Too many rooms created');
    }
    
    const code = generateRoomCode();
    const validContinent = validateContinent(continent);
    
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
        continent: validContinent,
        started: false,
        created: Date.now()
      },
      chat: []
    });
    
    socket.join(code);
    socketRooms.set(socket.id, code);
    socket.emit("room-created", { code, continent: validContinent });
  });

  socket.on("join-room", (code) => {
    if (!checkRateLimit(socket.id, 'join-room', 5, 60000)) {
      return socket.emit('join-error', 'Too many attempts');
    }
    
    if (typeof code !== 'string') return socket.emit('join-error', 'Invalid code');
    code = code.toUpperCase().slice(0, MAX_ROOM_CODE_LENGTH);
    
    const room = rooms.get(code);
    
    if (!room) return socket.emit("join-error", "Místnost neexistuje");
    if (room.guest) return socket.emit("join-error", "Místnost je plná");
    if (room.host === socket.id) return socket.emit("join-error", "Nemůžeš se připojit do vlastní místnosti");
    
    room.guest = socket.id;
    socket.join(code);
    socketRooms.set(socket.id, code);
    
    socket.emit("joined-room", { code, continent: room.gameState.continent });
    io.to(room.host).emit("guest-joined", { 
      canStart: true,
      message: "Soupeř se připojil! Můžeš spustit hru."
    });
    
    socket.emit("chat-history", room.chat);
  });

  socket.on("chat-message", (message) => {
    if (!checkRateLimit(socket.id, 'chat', 5, 5000)) return;
    
    const code = socketRooms.get(socket.id);
    if (!code) return;
    
    const room = rooms.get(code);
    if (!room) return;
    
    const cleanText = sanitizeString(message);
    if (!cleanText.trim()) return;
    
    const msgData = {
      sender: room.host === socket.id ? 'Host' : 'Soupeř',
      text: cleanText,
      time: new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'})
    };
    
    room.chat.push(msgData);
    // Limit chat history length
    if (room.chat.length > 50) room.chat.shift();
    
    io.to(code).emit("new-chat-message", msgData);
  });

  socket.on("start-game", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    
    const room = rooms.get(code);
    if (!room || room.host !== socket.id || room.gameState.started) return;
    
    room.gameState.started = true;
    io.to(code).emit("game-started");
    startNewRound(code);
  });

  socket.on("correct-guess", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    
    const room = rooms.get(code);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    
    const isHost = room.host === socket.id;
    room.gameState.finished = true;
    
    if (isHost) room.gameState.hostScore++;
    else room.gameState.guestScore++;
    
    broadcastResult(room, isHost ? 'host' : 'guest');
  });

  socket.on("out-of-attempts", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    
    const room = rooms.get(code);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    
    const isHost = room.host === socket.id;
    if (isHost) room.gameState.hostOut = true;
    else room.gameState.guestOut = true;
    
    if (room.gameState.hostOut && room.gameState.guestOut) {
      room.gameState.finished = true;
      broadcastResult(room, "draw");
    } else {
      const other = isHost ? room.guest : room.host;
      io.to(other).emit("opponent-out");
    }
  });

  socket.on("request-rematch", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    
    const room = rooms.get(code);
    if (!room) return;
    
    // Reset game state
    room.gameState.round = 1;
    room.gameState.hostScore = 0;
    room.gameState.guestScore = 0;
    room.gameState.finished = false;
    room.gameState.hostOut = false;
    room.gameState.guestOut = false;
    room.gameState.started = true;
    
    io.to(code).emit("game-started");
    startNewRound(code);
  });

  socket.on("disconnect", () => {
    const code = socketRooms.get(socket.id);
    if (code && rooms.has(code)) {
      const room = rooms.get(code);
      const isHost = room.host === socket.id;
      
      // Notify other player
      const other = isHost ? room.guest : room.host;
      if (other) {
        io.to(other).emit("opponent-left");
      }
      
      // Delayed cleanup to allow reconnect? For now immediate.
      if (isHost) {
        rooms.delete(code);
      } else {
        room.guest = null;
        room.gameState.started = false;
        io.to(room.host).emit("guest-left");
      }
    }
    socketRooms.delete(socket.id);
  });

  function startNewRound(code) {
    const room = rooms.get(code);
    if (!room || room.gameState.round > 5) return;
    
    const country = getRandomCountry(room.gameState.continent);
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

  function broadcastResult(room, roundWinner) {
    const isFinal = room.gameState.round >= 5;
    
    const payload = {
      winner: roundWinner,
      countryName: room.gameState.currentCountry[0],
      hostScore: room.gameState.hostScore,
      guestScore: room.gameState.guestScore,
      isFinal
    };
    
    io.to(room.host).emit("round-result", { ...payload, isHost: true });
    io.to(room.guest).emit("round-result", { ...payload, isHost: false });
    
    if (!isFinal) {
      room.gameState.round++;
      setTimeout(() => startNewRound(socketRooms.get(room.host)), 5000);
    } else {
      let gameWinner;
      if (room.gameState.hostScore > room.gameState.guestScore) gameWinner = "host";
      else if (room.gameState.hostScore < room.gameState.guestScore) gameWinner = "guest";
      else gameWinner = "draw";
      
      setTimeout(() => {
        io.to(room.host).emit("game-over", { winner: gameWinner, ...payload });
        io.to(room.guest).emit("game-over", { winner: gameWinner, ...payload });
      }, 5000);
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running securely on port ${PORT}`);
});
