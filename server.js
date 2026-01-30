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

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'];
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

// DATA ZEMÍ - kompletní seznam pro hru
const countriesData = {
  europe: [
    ["Albánie",41.32,19.81,["albania"]],
    ["Andora",42.50,1.52,["andorra"]],
    ["Rakousko",48.20,16.37,["austria"]],
    ["Bělorusko",53.90,27.56,["belarus","bylorusko"]],
    ["Belgie",50.85,4.35,["belgium"]],
    ["Bosna a Hercegovina",43.85,18.41,["bosna","bosnia"]],
    ["Bulharsko",42.69,23.32,["bulgaria"]],
    ["Chorvatsko",45.81,15.98,["croatia"]],
    ["Kypr",35.18,33.38,["cyprus"]],
    ["Česko",50.07,14.43,["czech","cesko","czechia"]],
    ["Dánsko",55.67,12.56,["denmark"]],
    ["Estonsko",59.43,24.75,["estonia"]],
    ["Finsko",60.16,24.93,["finland"]],
    ["Francie",48.85,2.35,["france"]],
    ["Německo",52.52,13.40,["germany","nemecko"]],
    ["Řecko",37.98,23.72,["greece","recko"]],
    ["Maďarsko",47.49,19.04,["hungary","madarsko"]],
    ["Island",64.14,-21.94,["iceland"]],
    ["Irsko",53.34,-6.26,["ireland"]],
    ["Itálie",41.90,12.49,["italy"]],
    ["Kosovo",42.66,21.16,["kosovo"]],
    ["Lotyšsko",56.94,24.10,["latvia"]],
    ["Lichtenštejnsko",47.14,9.52,["liechtenstein"]],
    ["Litva",54.68,25.27,["lithuania"]],
    ["Lucembursko",49.61,6.13,["luxembourg"]],
    ["Malta",35.89,14.50,["malta"]],
    ["Monako",43.73,7.42,["monaco"]],
    ["Černá Hora",42.44,19.26,["montenegro"]],
    ["Nizozemsko",52.36,4.90,["netherlands","holandsko"]],
    ["Severní Makedonie",41.99,21.43,["macedonia","makedonie"]],
    ["Norsko",59.91,10.75,["norway"]],
    ["Polsko",52.22,21.01,["poland"]],
    ["Portugalsko",38.72,-9.13,["portugal"]],
    ["Moldavsko",47.01,28.86,["moldova"]],
    ["Rumunsko",44.42,26.10,["romania"]],
    ["Rusko",55.75,37.61,["russia"]],
    ["San Marino",43.94,12.46,["san marino"]],
    ["Srbsko",44.78,20.44,["serbia"]],
    ["Slovensko",48.14,17.10,["slovakia"]],
    ["Slovinsko",46.05,14.50,["slovenia"]],
    ["Španělsko",40.41,-3.70,["spain"]],
    ["Švédsko",59.32,18.06,["sweden"]],
    ["Švýcarsko",46.94,7.44,["switzerland"]],
    ["Ukrajina",50.45,30.52,["ukraine"]],
    ["Velká Británie",51.50,-0.12,["britain","uk","england"]],
    ["Vatikán",41.90,12.45,["vatican"]]
  ],
  asia: [
    ["Afghánistán",34.52,69.17,["afghanistan"]],
    ["Arménie",40.17,44.50,["armenia"]],
    ["Ázerbájdžán",40.40,49.86,["azerbaijan"]],
    ["Bahrajn",26.22,50.58,["bahrain"]],
    ["Bangladéš",23.81,90.41,["bangladesh"]],
    ["Bhútán",27.51,90.43,["bhutan"]],
    ["Brunej",4.53,114.72,["brunei"]],
    ["Kambodža",11.55,104.92,["cambodia"]],
    ["Čína",39.90,116.41,["china"]],
    ["Georgie",41.71,44.82,["georgia","gruzie"]],
    ["Indie",28.61,77.20,["india"]],
    ["Indonésie",-6.20,106.84,["indonesia"]],
    ["Irán",35.68,51.38,["iran"]],
    ["Irák",33.31,44.36,["iraq"]],
    ["Izrael",31.76,35.21,["israel"]],
    ["Japonsko",35.67,139.65,["japan"]],
    ["Jordánsko",31.94,35.92,["jordan"]],
    ["Kazachstán",51.16,71.42,["kazakhstan"]],
    ["Kuvajt",29.37,47.97,["kuwait"]],
    ["Kyrgyzstán",42.87,74.59,["kyrgyzstan"]],
    ["Laos",17.97,102.63,["laos"]],
    ["Libanon",33.89,35.50,["lebanon"]],
    ["Malajsie",3.13,101.68,["malaysia"]],
    ["Maledivy",3.20,73.22,["maldives"]],
    ["Mongolsko",47.91,106.88,["mongolia"]],
    ["Myanmar",19.76,96.07,["myanmar","burma"]],
    ["Nepál",27.71,85.32,["nepal"]],
    ["Korea",39.03,125.76,["north korea","kldr","severni korea"]],
    ["Omán",23.58,58.40,["oman"]],
    ["Pákistán",33.68,73.04,["pakistan"]],
    ["Filipíny",14.59,120.98,["philippines"]],
    ["Katar",25.28,51.53,["qatar"]],
    ["Saúdská Arábie",24.71,46.67,["saudi"]],
    ["Singapur",1.35,103.81,["singapore"]],
    ["Jižní Korea",37.56,126.97,["south korea","korea"]],
    ["Srí Lanka",6.92,79.86,["sri lanka"]],
    ["Sýrie",33.51,36.27,["syria"]],
    ["Tádžikistán",38.55,68.78,["tajikistan"]],
    ["Thajsko",13.75,100.50,["thailand"]],
    ["Východní Timor",-8.55,125.56,["timor","east timor"]],
    ["Turecko",39.93,32.85,["turkey"]],
    ["Turkmenistán",37.96,58.32,["turkmenistan"]],
    ["Spojené arabské emiráty",24.45,54.37,["uae","emiraty"]],
    ["Uzbekistán",41.29,69.24,["uzbekistan"]],
    ["Vietnam",21.02,105.83,["vietnam"]],
    ["Jemen",15.36,44.19,["yemen"]]
  ],
  americas: [
    ["Antigua a Barbuda",17.12,-61.84,["antigua"]],
    ["Argentina",-34.60,-58.38,["argentina"]],
    ["Bahamy",25.03,-77.39,["bahamas"]],
    ["Barbados",13.10,-59.61,["barbados"]],
    ["Belize",17.25,-88.76,["belize"]],
    ["Bolívie",-17.78,-63.18,["bolivia"]],
    ["Brazílie",-15.79,-47.88,["brazil"]],
    ["Kanada",45.42,-75.69,["canada"]],
    ["Chile",-33.44,-70.66,["chile"]],
    ["Kolumbie",4.71,-74.07,["colombia"]],
    ["Kostarika",9.92,-84.09,["costa rica"]],
    ["Kuba",23.11,-82.36,["cuba"]],
    ["Dominika",15.41,-61.37,["dominica"]],
    ["Dominikánská republika",18.73,-70.16,["dominican republic"]],
    ["Ekvádor",-0.18,-78.46,["ecuador"]],
    ["Salvador",13.69,-89.21,["el salvador"]],
    ["Grenada",12.11,-61.67,["grenada"]],
    ["Guatemala",14.63,-90.50,["guatemala"]],
    ["Guyana",6.80,-58.16,["guyana"]],
    ["Haiti",18.59,-72.30,["haiti"]],
    ["Honduras",14.07,-87.20,["honduras"]],
    ["Jamajка",18.01,-76.80,["jamaica"]],
    ["Mexiko",19.43,-99.13,["mexico"]],
    ["Nikaragua",12.86,-85.20,["nicaragua"]],
    ["Panama",8.98,-79.51,["panama"]],
    ["Paraguay",-25.26,-57.57,["paraguay"]],
    ["Peru",-12.04,-77.04,["peru"]],
    ["Svatý Kryštof a Nevis",17.35,-62.78,["saint kitts"]],
    ["Svatá Lucie",13.90,-60.97,["saint lucia"]],
    ["Svatý Vincenc a Grenadiny",13.25,-61.19,["saint vincent"]],
    ["Surinam",5.85,-55.20,["suriname"]],
    ["Trinidad a Tobago",10.65,-61.51,["trinidad"]],
    ["USA",38.90,-77.03,["usa","america"]],
    ["Uruguay",-34.90,-56.16,["uruguay"]],
    ["Venezuela",10.48,-66.90,["venezuela"]]
  ],
  africa: [
    ["Alžírsko",28.03,1.65,["algeria"]],
    ["Angola",-8.83,13.23,["angola"]],
    ["Benin",6.49,2.62,["benin"]],
    ["Botswana",-24.62,25.92,["botswana"]],
    ["Burkina Faso",12.37,-1.52,["burkina faso"]],
    ["Burundi",-3.38,29.36,["burundi"]],
    ["Kamerun",3.84,11.50,["cameroon"]],
    ["Kapverdy",14.91,-23.51,["cape verde"]],
    ["Středoafrická republika",6.61,20.93,["car"]],
    ["Čad",12.13,15.05,["chad"]],
    ["Komory",-11.70,43.25,["comoros"]],
    ["Demokratická republika Kongo",-4.44,15.26,["drc","kongo"]],
    ["Republika Kongo",-4.26,15.24,["congo"]],
    ["Džibutsko",11.57,43.15,["djibouti"]],
    ["Egypt",30.04,31.23,["egypt"]],
    ["Rovníková Guinea",1.65,10.26,["equatorial guinea"]],
    ["Eritrea",15.32,38.92,["eritrea"]],
    ["Svazijsko",-26.30,31.13,["eswatini","swaziland"]],
    ["Etiopie",9.00,38.75,["ethiopia"]],
    ["Gabon",-0.80,11.60,["gabon"]],
    ["Gambie",13.44,-15.31,["gambia"]],
    ["Ghana",5.60,-0.18,["ghana"]],
    ["Guinea",9.94,-9.69,["guinea"]],
    ["Guinea-Bissau",11.80,-15.18,["guinea bissau"]],
    ["Pobřeží slonoviny",6.82,-5.27,["ivory coast","pobrezi slonoviny"]],
    ["Keňa",-1.29,36.82,["kenya"]],
    ["Lesotho",-29.61,28.23,["lesotho"]],
    ["Liberie",6.42,-10.80,["liberia"]],
    ["Libye",32.88,13.19,["libya"]],
    ["Madagaskar",-18.87,47.50,["madagascar"]],
    ["Malawi",-13.95,33.77,["malawi"]],
    ["Mali",12.63,-8.00,["mali"]],
    ["Mauritánie",18.07,-15.96,["mauritania"]],
    ["Mauricius",-20.34,57.55,["mauritius"]],
    ["Maroko",34.02,-6.84,["morocco"]],
    ["Mosambik",-25.96,32.57,["mozambique"]],
    ["Namibie",-22.56,17.06,["namibia"]],
    ["Niger",13.51,2.12,["niger"]],
    ["Nigérie",9.08,7.39,["nigeria"]],
    ["Rwanda",-1.94,29.87,["rwanda"]],
    ["Svatý Tomáš a Princův ostrov",0.33,6.73,["sao tome"]],
    ["Senegal",14.71,-17.46,["senegal"]],
    ["Seychely",-4.67,55.46,["seychelles"]],
    ["Sierra Leone",8.46,-13.23,["sierra leone"]],
    ["Somálsko",2.04,45.31,["somalia"]],
    ["Jižní Afrika",-25.74,28.22,["south africa","africa"]],
    ["Jižní Súdán",4.85,31.58,["south sudan"]],
    ["Súdán",15.50,32.58,["sudan"]],
    ["Tanzánie",-6.36,34.88,["tanzania"]],
    ["Togo",6.13,1.22,["togo"]],
    ["Tunisko",36.80,10.18,["tunisia"]],
    ["Uganda",0.34,32.58,["uganda"]],
    ["Zambie",-15.38,28.32,["zambia"]],
    ["Zimbabwe",-17.82,31.05,["zimbabwe"]]
  ],
  oceania: [
    ["Austrálie",-35.28,149.13,["australia"]],
    ["Fidži",-18.12,178.44,["fiji"]],
    ["Kiribati",1.32,172.98,["kiribati"]],
    ["Marshallovy ostrovy",7.11,171.18,["marshall islands"]],
    ["Mikronésie",6.92,158.25,["micronesia"]],
    ["Nauru",-0.52,166.93,["nauru"]],
    ["Nový Zéland",-41.28,174.77,["new zealand","zealand"]],
    ["Palau",7.51,134.58,["palau"]],
    ["Papua Nová Guinea",-9.47,147.18,["papua"]],
    ["Samoa",-13.85,-171.75,["samoa"]],
    ["Šalomounovy ostrovy",-9.43,159.95,["solomon islands"]],
    ["Tonga",-21.13,-175.20,["tonga"]],
    ["Tuvalu",-8.51,179.20,["tuvalu"]],
    ["Vanuatu",-17.73,168.32,["vanuatu"]]
  ]
};
countriesData.world = [...countriesData.europe, ...countriesData.asia, ...countriesData.americas, ...countriesData.africa, ...countriesData.oceania];

const MAX_MSG = 200;
const sanitize = (str) => typeof str === 'string' ? str.slice(0, MAX_MSG).replace(/[<>]/g, '') : '';
const validateContinent = (c) => ['world','europe','asia','americas','africa','oceania'].includes(c) ? c : 'world';
const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const rooms = new Map();
const socketRooms = new Map();

// Cleanup prázdných místností každých 5 minut
setInterval(() => {
  for (const [code, room] of rooms.entries()) {
    const activePlayers = room.players.filter(p => io.sockets.sockets.has(p.id));
    if (activePlayers.length === 0) {
      rooms.delete(code);
      console.log(`Smazána prázdná místnost: ${code}`);
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
  console.log("Připojen hráč:", socket.id);
  
  // Pošleme inicializační data (všechny země pro nášeptávání na klientovi)
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
        processingGuess: false
      },
      chat: [],
      rematchVotes: new Set()
    });
    
    socket.join(code);
    socketRooms.set(socket.id, code);
    socket.emit("room-created", { code, continent: c, maxPlayers: playerLimit });
    console.log(`Vytvořena místnost ${code}, host: ${socket.id}`);
  });

  socket.on("join-room", ({ code, nickname }) => {
    if (!rateLimit(socket.id, 'join', 5, 60000)) return socket.emit('join-error', "Příliš mnoho pokusů o připojení");
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
    console.log(`Hráč ${name} se připojil do místnosti ${code}`);
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
    
    room.rematchVotes.clear();
    room.gameState.started = true;
    
    io.to(code).emit("game-started", { 
      totalRounds: room.gameState.totalRounds, 
      players: room.players.map(p => ({id: p.id, name: p.name})) 
    });
    
    startNewRound(code, room);
    console.log(`Hra v místnosti ${code} začala`);
  });

  socket.on("correct-guess", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    
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
    if (!room) return;
    
    room.rematchVotes.add(socket.id);
    
    const votes = room.rematchVotes.size;
    const total = room.players.length;
    
    io.to(code).emit("rematch-status", { 
      votes, 
      total, 
      ready: votes === total 
    });
    
    if (votes === total && total > 0) {
      // Restart hry
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
      room.rematchVotes.clear();
      
      io.to(code).emit("game-started", { 
        totalRounds: room.gameState.totalRounds, 
        players: room.players.map(p => ({id: p.id, name: p.name})) 
      });
      startNewRound(code, room);
      console.log(`Rematch v místnosti ${code}`);
    }
  });

  socket.on("cancel-rematch", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    
    room.rematchVotes.delete(socket.id);
    io.to(code).emit("rematch-status", { 
      votes: room.rematchVotes.size, 
      total: room.players.length,
      ready: false
    });
  });

  socket.on("disconnect", () => {
    const code = socketRooms.get(socket.id);
    if (code && rooms.has(code)) {
      const room = rooms.get(code);
      
      if (room.rematchVotes) {
        room.rematchVotes.delete(socket.id);
        io.to(code).emit("rematch-status", { 
          votes: room.rematchVotes.size, 
          total: room.players.length - 1,
          ready: false
        });
      }
      
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(code);
          console.log(`Místnost ${code} smazána (poslední hráč odešel)`);
        } else {
          if (room.host === socket.id && room.players.length > 0) {
            room.host = room.players[0].id;
            io.to(room.players[0].id).emit("became-host");
            addChatMessage(code, 'Systém', `${player.name} odešel, ${room.players[0].name} je nový host`, null);
          } else {
            addChatMessage(code, 'Systém', `${player.name} se odpojil`, null);
          }
          
          updatePlayerList(code, room);
          
          // Pokud zůstal jen jeden hráč, hra končí
          if (room.gameState.started && room.players.length === 1) {
            io.to(code).emit("game-over", { 
              winners: [{id: room.players[0].id, name: room.players[0].name}],
              scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
              isDraw: false
            });
            room.gameState.started = false;
          }
        }
      }
    }
    socketRooms.delete(socket.id);
    console.log("Odpojen hráč:", socket.id);
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
    
    console.log(`Konec hry v místnosti ${code}, vítězové: ${winners.map(w => w.name).join(', ')}`);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server běží na portu ${PORT}`));
