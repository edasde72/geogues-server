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

const BLOCKED_FILES = ['server.js', '.env', '.env.local', 'package.json', 'package-lock.json'];
app.use((req, res, next) => {
  const requested = req.path.toLowerCase();
  if (BLOCKED_FILES.some(f => requested.includes(f))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS denied'));
  }
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname, { dotfiles: 'deny', index: ['index.html'] }));

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
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e6
});

const countriesData = {
  europe: [["Albánie",41.32,19.81,["albania"]],["Rakousko",48.20,16.37,["austria"]],["Belgie",50.85,4.35,["belgium"]],["Bulharsko",42.69,23.32,["bulgaria"]],["Chorvatsko",45.81,15.98,["croatia"]],["Česko",50.07,14.43,["czech","cesko"]],["Dánsko",55.67,12.56,["denmark"]],["Estonsko",59.43,24.75,["estonia"]],["Finsko",60.16,24.93,["finland"]],["Francie",48.85,2.35,["france"]],["Německo",52.52,13.40,["germany"]],["Řecko",37.98,23.72,["greece"]],["Maďarsko",47.49,19.04,["hungary"]],["Island",64.14,-21.94,["iceland"]],["Irsko",53.34,-6.26,["ireland"]],["Itálie",41.90,12.49,["italy"]],["Litva",54.68,25.27,["lithuania"]],["Nizozemsko",52.36,4.90,["netherlands"]],["Norsko",59.91,10.75,["norway"]],["Polsko",52.22,21.01,["poland"]],["Portugalsko",38.72,-9.13,["portugal"]],["Rumunsko",44.42,26.10,["romania"]],["Rusko",55.75,37.61,["russia"]],["Slovensko",48.14,17.10,["slovakia"]],["Slovinsko",46.05,14.50,["slovenia"]],["Španělsko",40.41,-3.70,["spain"]],["Švédsko",59.32,18.06,["sweden"]],["Švýcarsko",46.94,7.44,["switzerland"]],["Ukrajina",50.45,30.52,["ukraine"]],["Velká Británie",51.50,-0.12,["britain","uk"]]],
  asia: [["Afghánistán",34.52,69.17,["afghanistan"]],["Bangladéš",23.81,90.41,["bangladesh"]],["Čína",39.90,116.41,["china"]],["Indie",28.61,77.20,["india"]],["Indonésie",-6.20,106.84,["indonesia"]],["Irán",35.68,51.38,["iran"]],["Irák",33.31,44.36,["iraq"]],["Izrael",31.76,35.21,["israel"]],["Japonsko",35.67,139.65,["japan"]],["Jordánsko",31.94,35.92,["jordan"]],["Kazachstán",51.16,71.42,["kazakhstan"]],["Malajsie",3.13,101.68,["malaysia"]],["Pákistán",33.68,73.04,["pakistan"]],["Filipíny",14.59,120.98,["philippines"]],["Saúdská Arábie",24.71,46.67,["saudi"]],["Singapur",1.35,103.81,["singapore"]],["Jižní Korea",37.56,126.97,["korea"]],["Thajsko",13.75,100.50,["thailand"]],["Turecko",39.93,32.85,["turkey"]],["Vietnam",21.02,105.83,["vietnam"]]],
  americas: [["Argentina",-34.60,-58.38,["argentyna"]],["Brazílie",-15.79,-47.88,["brazil"]],["Kanada",45.42,-75.69,["canada"]],["Chile",-33.44,-70.66,["chile"]],["Kolumbie",4.71,-74.07,["colombia"]],["Kuba",23.11,-82.36,["cuba"]],["Mexiko",19.43,-99.13,["mexico"]],["Peru",-12.04,-77.04,["peru"]],["USA",38.90,-77.03,["usa"]]],
  africa: [["Alžírsko",28.03,1.65,["algeria"]],["Egypt",30.04,31.23,["egypt"]],["Keňa",-1.29,36.82,["kenya"]],["Maroko",34.02,-6.84,["morocco"]],["Jižní Afrika",-25.74,28.22,["africa"]],["Tunisko",36.80,10.18,["tunisia"]]],
  oceania: [["Austrálie",-35.28,149.13,["australia"]],["Nový Zéland",-41.28,174.77,["zealand"]]]
};
countriesData.world = [...countriesData.europe, ...countriesData.asia, ...countriesData.americas, ...countriesData.africa, ...countriesData.oceania];

const MAX_MSG = 200;
const sanitize = (str) => typeof str === 'string' ? str.slice(0, MAX_MSG).replace(/[<>]/g, '') : '';
const validateContinent = (c) => ['world','europe','asia','americas','africa','oceania'].includes(c) ? c : 'world';
const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const rooms = new Map();
const socketRooms = new Map();

setInterval(() => {
  for (const [code, room] of rooms.entries()) {
    const activePlayers = room.players.filter(p => io.sockets.sockets.has(p.id));
    if (activePlayers.length === 0) {
      rooms.delete(code);
    }
  }
}, 300000);

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
  console.log("Connected:", socket.id);
  socket.emit('init-data', { countries: countriesData });

  socket.on("create-room", ({ continent, maxPlayers }) => {
    if (!rateLimit(socket.id, 'create', 3, 60000)) return;
    const code = generateCode();
    const c = validateContinent(continent);
    const playerLimit = Math.min(Math.max(parseInt(maxPlayers) || 4, 2), 8);
    
    rooms.set(code, {
      host: socket.id,
      players: [{ id: socket.id, name: 'Host', score: 0, out: false, guessed: false }],
      maxPlayers: playerLimit,
      gameState: { 
        round: 1, 
        currentCountry: null, 
        finished: false, 
        continent: c, 
        started: false,
        totalRounds: 5,
        processingGuess: false // Ochrana proti závodní podmínce
      },
      chat: []
    });
    
    socket.join(code);
    socketRooms.set(socket.id, code);
    socket.emit("room-created", { code, continent: c, maxPlayers: playerLimit });
  });

  socket.on("join-room", ({ code, nickname }) => {
    if (!rateLimit(socket.id, 'join', 5, 60000)) return socket.emit('join-error', "Too many attempts");
    if (typeof code !== 'string') return;
    code = code.toUpperCase().slice(0,10);
    
    const room = rooms.get(code);
    if (!room) return socket.emit("join-error", "Místnost neexistuje");
    if (room.players.length >= room.maxPlayers) return socket.emit("join-error", "Místnost je plná");
    if (room.gameState.started) return socket.emit("join-error", "Hra už začala");
    if (room.players.find(p => p.id === socket.id)) return socket.emit("join-error", "Už jsi v místnosti");
    
    const name = sanitize(nickname).slice(0, 20) || `Hráč ${room.players.length + 1}`;
    room.players.push({ id: socket.id, name: name, score: 0, out: false, guessed: false });
    socket.join(code);
    socketRooms.set(socket.id, code);
    
    socket.emit("joined-room", { code, continent: room.gameState.continent, yourId: socket.id });
    socket.emit("chat-history", room.chat);
    
    socket.to(code).emit("player-joined", { name: name, count: room.players.length, max: room.maxPlayers });
    addChatMessage(code, 'Systém', `${name} se připojil`, socket.id);
    updatePlayerList(code, room);
  });

  socket.on("chat-message", (msg) => {
    if (!rateLimit(socket.id, 'chat', 5, 5000)) return;
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    const clean = sanitize(msg);
    if (!clean || !player) return;
    
    const data = { 
      sender: player.name, 
      text: clean, 
      time: new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'}),
      isHost: room.host === socket.id
    };
    room.chat.push(data);
    if (room.chat.length > 50) room.chat.shift();
    io.to(code).emit("new-chat-message", data);
  });

  socket.on("start-game", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    
    if (!room || room.host !== socket.id || room.gameState.started) return;
    if (room.players.length < 2) return socket.emit("error", "Potřebuješ alespoň 2 hráče");
    
    room.gameState.started = true;
    io.to(code).emit("game-started", { totalRounds: room.gameState.totalRounds, players: room.players.map(p => ({id: p.id, name: p.name})) });
    startNewRound(code, room);
  });

  socket.on("correct-guess", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    
    // Ochrana proti závodní podmínce
    if (room.gameState.processingGuess) return;
    room.gameState.processingGuess = true;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.guessed) {
      room.gameState.processingGuess = false;
      return;
    }
    
    player.score += 1;
    player.guessed = true;
    room.gameState.finished = true;
    
    const isFinal = room.gameState.round >= room.gameState.totalRounds;
    
    io.to(code).emit("round-result", {
      winner: player.name,
      winnerId: socket.id,
      countryName: room.gameState.currentCountry[0],
      scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      isFinal: isFinal
    });
    
    if (!isFinal) {
      room.gameState.round++;
      setTimeout(() => {
        room.gameState.processingGuess = false;
        startNewRound(code, room);
      }, 3000);
    } else {
      setTimeout(() => {
        room.gameState.processingGuess = false;
        endGame(room, code);
      }, 3000);
    }
  });

  socket.on("out-of-attempts", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.out) return;
    
    player.out = true;
    io.to(code).emit("player-out", { name: player.name, id: socket.id });
    
    const activePlayers = room.players.filter(p => !p.out && !p.guessed);
    const someoneGuessed = room.players.some(p => p.guessed);
    
    if (activePlayers.length === 0 && !someoneGuessed) {
      room.gameState.finished = true;
      const isFinal = room.gameState.round >= room.gameState.totalRounds;
      
      io.to(code).emit("round-result", {
        winner: null,
        countryName: room.gameState.currentCountry[0],
        scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        isFinal: isFinal
      });
      
      if (!isFinal) {
        room.gameState.round++;
        setTimeout(() => startNewRound(code, room), 3000);
      } else {
        setTimeout(() => endGame(room, code), 3000);
      }
    }
  });

  socket.on("request-rematch", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.host !== socket.id) return;
    
    room.players.forEach(p => {
      p.score = 0;
      p.out = false;
      p.guessed = false;
    });
    room.gameState.round = 1;
    room.gameState.finished = false;
    room.gameState.started = true;
    room.gameState.currentCountry = null;
    room.gameState.processingGuess = false;
    
    io.to(code).emit("game-started", { totalRounds: room.gameState.totalRounds, players: room.players.map(p => ({id: p.id, name: p.name})) });
    startNewRound(code, room);
  });

  socket.on("disconnect", () => {
    const code = socketRooms.get(socket.id);
    if (code && rooms.has(code)) {
      const room = rooms.get(code);
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          if (room.host === socket.id && room.players.length > 0) {
            room.host = room.players[0].id;
            io.to(room.players[0].id).emit("became-host");
            addChatMessage(code, 'Systém', `${player.name} odešel, ${room.players[0].name} je nový host`, null);
          } else {
            addChatMessage(code, 'Systém', `${player.name} se odpojil`, null);
          }
          
          updatePlayerList(code, room);
          
          if (room.gameState.started && room.players.length === 1) {
            io.to(code).emit("game-over", { 
              winners: [{id: room.players[0].id, name: room.players[0].name}],
              scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
              isDraw: false
            });
          }
        }
      }
    }
    socketRooms.delete(socket.id);
  });

  function addChatMessage(code, sender, text, excludeId) {
    const room = rooms.get(code);
    if (!room) return;
    const data = {
      sender: sender,
      text: text,
      time: new Date().toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'}),
      isSystem: sender === 'Systém'
    };
    room.chat.push(data);
    if (room.chat.length > 50) room.chat.shift();
    
    if (excludeId) {
      socket.to(code).emit("new-chat-message", data);
    } else {
      io.to(code).emit("new-chat-message", data);
    }
  }

  function updatePlayerList(code, room) {
    const list = room.players.map(p => ({ 
      id: p.id, 
      name: p.name, 
      isHost: p.id === room.host 
    }));
    io.to(code).emit("player-list", { players: list, max: room.maxPlayers });
  }

  function startNewRound(code, room) {
    room.players.forEach(p => {
      p.out = false;
      p.guessed = false;
    });
    room.gameState.finished = false;
    
    const list = countriesData[room.gameState.continent] || countriesData.world;
    let country;
    // Zabránění stejné zemi dvakrát po sobě
    do {
      country = list[Math.floor(Math.random() * list.length)];
    } while (country === room.gameState.currentCountry && list.length > 1);
    
    room.gameState.currentCountry = country;
    
    io.to(code).emit("new-round", {
      round: room.gameState.round,
      totalRounds: room.gameState.totalRounds,
      country: country,
      players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score }))
    });
  }

  function endGame(room, code) {
    const maxScore = Math.max(...room.players.map(p => p.score));
    const winners = room.players.filter(p => p.score === maxScore);
    
    io.to(code).emit("game-over", {
      winners: winners.map(w => ({ id: w.id, name: w.name })),
      scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      isDraw: winners.length > 1
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server ready on port ${PORT}`));
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server ready on port ${PORT}`));
