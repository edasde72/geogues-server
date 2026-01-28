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

// BEZPEČNOST PRVNÍ: Blokace přístupu k citlivým souborům v rootu
const BLOCKED_FILES = ['server.js', '.env', '.env.local', 'package.json', 'package-lock.json'];
app.use((req, res, next) => {
  const requested = req.path.toLowerCase();
  if (BLOCKED_FILES.some(f => requested.includes(f))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

// CORS s omezením
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS denied'));
  }
}));

// Parsování JSON
app.use(express.json({ limit: '10kb' }));

// Statické soubory z rootu (bezpečné díky middleware výše)
app.use(express.static(__dirname, {
  dotfiles: 'deny',  // Zakáže přístup k .souborům
  index: ['index.html']
}));

// Rate limiting pro HTTP (jednoduchý memory-based)
const requestCounts = new Map();
setInterval(() => requestCounts.clear(), 60000);
app.use((req, res, next) => {
  const ip = req.ip;
  const count = (requestCounts.get(ip) || 0) + 1;
  if (count > 100) return res.status(429).json({ error: 'Too many requests' });
  requestCounts.set(ip, count);
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins },
  maxHttpBufferSize: 1e6
});

// Datový model
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
countriesData.world = [...countriesData.europe, ...countriesData.asia, ...countriesData.americas, ...countriesData.africa, ...countriesData.oceania];

// Validace
const MAX_MSG = 200;
const sanitize = (str) => typeof str === 'string' ? str.slice(0, MAX_MSG).replace(/[<>]/g, '') : '';
const validateContinent = (c) => ['world','europe','asia','americas','africa','oceania'].includes(c) ? c : 'world';
const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const rooms = new Map();
const socketRooms = new Map();

// Cleanup
setInterval(() => {
  for (const [code, room] of rooms.entries()) {
    if (!io.sockets.sockets.get(room.host) && (!room.guest || !io.sockets.sockets.get(room.guest))) {
      rooms.delete(code);
    }
  }
}, 300000);

// Rate limiting
const limits = new Map();
function rateLimit(id, event, max=10, windowMs=10000) {
  const key = `${id}:${event}`;
  const now = Date.now();
  const data = limits.get(key) || { count: 0, reset: now + windowMs };
  if (now > data.reset) { data.count = 0; data.reset = now + windowMs; }
  if (data.count >= max) return false;
  data.count++; limits.set(key, data); return true;
}

io.on("connection", socket => {
  socket.emit('init-data', { countries: countriesData });

  socket.on("create-room", (continent) => {
    if (!rateLimit(socket.id, 'create', 3, 60000)) return;
    const code = generateCode();
    const c = validateContinent(continent);
    rooms.set(code, {
      host: socket.id, guest: null,
      gameState: { round:1, hostScore:0, guestScore:0, currentCountry:null, finished:false, hostOut:false, guestOut:false, continent:c, started:false },
      chat: []
    });
    socket.join(code);
    socketRooms.set(socket.id, code);
    socket.emit("room-created", { code, continent: c });
  });

  socket.on("join-room", (code) => {
    if (!rateLimit(socket.id, 'join', 5, 60000)) return socket.emit('join-error', "Too many attempts");
    if (typeof code !== 'string') return;
    code = code.toUpperCase().slice(0,10);
    const room = rooms.get(code);
    if (!room) return socket.emit("join-error", "Místnost neexistuje");
    if (room.guest) return socket.emit("join-error", "Plná");
    if (room.host === socket.id) return socket.emit("join-error", "Vlastní místnost");
    
    room.guest = socket.id;
    socket.join(code);
    socketRooms.set(socket.id, code);
    socket.emit("joined-room", { code, continent: room.gameState.continent });
    io.to(room.host).emit("guest-joined", { canStart:true, message:"Soupeř připojen" });
    socket.emit("chat-history", room.chat);
  });

  socket.on("chat-message", (msg) => {
    if (!rateLimit(socket.id, 'chat', 5, 5000)) return;
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const clean = sanitize(msg);
    if (!clean) return;
    const data = { sender: room.host === socket.id ? 'Host' : 'Soupeř', text: clean, time: new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'}) };
    room.chat.push(data);
    if (room.chat.length > 50) room.chat.shift();
    io.to(code).emit("new-chat-message", data);
  });

  socket.on("start-game", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.host !== socket.id || room.gameState.started) return;
    room.gameState.started = true;
    io.to(code).emit("game-started");
    startRound(code);
  });

  socket.on("correct-guess", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    const isHost = room.host === socket.id;
    room.gameState.finished = true;
    isHost ? room.gameState.hostScore++ : room.gameState.guestScore++;
    broadcastResult(room, isHost ? 'host' : 'guest');
  });

  socket.on("out-of-attempts", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    const isHost = room.host === socket.id;
    isHost ? room.gameState.hostOut = true : room.gameState.guestOut = true;
    if (room.gameState.hostOut && room.gameState.guestOut) {
      room.gameState.finished = true;
      broadcastResult(room, "draw");
    } else {
      io.to(isHost ? room.guest : room.host).emit("opponent-out");
    }
  });

  socket.on("request-rematch", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    room.gameState = { ...room.gameState, round:1, hostScore:0, guestScore:0, finished:false, hostOut:false, guestOut:false, started:true };
    io.to(code).emit("game-started");
    startRound(code);
  });

  socket.on("disconnect", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (room) {
      const isHost = room.host === socket.id;
      const other = isHost ? room.guest : room.host;
      if (other) io.to(other).emit("opponent-left");
      isHost ? rooms.delete(code) : (room.guest = null, room.gameState.started = false);
    }
  });
});

function startRound(code) {
  const room = rooms.get(code);
  if (!room || room.gameState.round > 5) return;
  const list = countriesData[room.gameState.continent] || countriesData.world;
  const country = list[Math.floor(Math.random() * list.length)];
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
  const payload = { winner, countryName: room.gameState.currentCountry[0], hostScore: room.gameState.hostScore, guestScore: room.gameState.guestScore, isFinal };
  io.to(room.host).emit("round-result", { ...payload, isHost: true });
  io.to(room.guest).emit("round-result", { ...payload, isHost: false });
  if (!isFinal) {
    room.gameState.round++;
    setTimeout(() => startRound(room.host), 5000);
  } else {
    const gameWinner = room.gameState.hostScore > room.gameState.guestScore ? 'host' : 
                      room.gameState.hostScore < room.gameState.guestScore ? 'guest' : 'draw';
    setTimeout(() => {
      io.to(room.host).emit("game-over", { ...payload, winner: gameWinner });
      io.to(room.guest).emit("game-over", { ...payload, winner: gameWinner });
    }, 5000);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Secure server on port ${PORT}`));
