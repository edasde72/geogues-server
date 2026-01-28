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

  socket.on("create-room", (data) => {
    const { nickname, continent } = data;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    currentRoom = code;
    
    const room = {
      players: [{
        id: socket.id,
        nickname: nickname || "Host",
        score: 0,
        isHost: true,
        ready: false,
        guessed: false,
        attempts: 0
      }],
      gameState: {
        round: 1,
        currentCountry: null,
        continent: continent || 'world',
        started: false,
        finished: false,
        winnersThisRound: [] // Kdo už uhodl v tomto kole
      },
      chat: []
    };
    
    rooms.set(code, room);
    socket.join(code);
    socket.emit("room-created", { code, players: room.players, isHost: true });
  });

  socket.on("join-room", (data) => {
    const { code: roomCode, nickname } = data;
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);
    
    if (!room) {
      socket.emit("join-error", "Místnost neexistuje");
      return;
    }
    if (room.players.length >= 8) {
      socket.emit("join-error", "Místnost je plná (max 8 hráčů)");
      return;
    }
    if (room.gameState.started) {
      socket.emit("join-error", "Hra už začala");
      return;
    }
    
    currentRoom = code;
    const newPlayer = {
      id: socket.id,
      nickname: nickname || `Hráč ${room.players.length + 1}`,
      score: 0,
      isHost: false,
      ready: false,
      guessed: false,
      attempts: 0
    };
    
    room.players.push(newPlayer);
    socket.join(code);
    
    socket.emit("joined-room", { code, players: room.players, isHost: false });
    io.to(code).emit("player-joined", { 
      players: room.players, 
      message: `${newPlayer.nickname} se připojil` 
    });
  });

  socket.on("player-ready", (isReady) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = isReady;
      io.to(currentRoom).emit("players-updated", room.players);
      
      // Kontrola jestli všichni jsou ready (min 2 hráči)
      const allReady = room.players.length >= 2 && room.players.every(p => p.ready);
      if (allReady) {
        io.to(currentRoom).emit("all-ready");
      }
    }
  });

  socket.on("start-game", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player?.isHost) return;
    if (room.players.length < 2) return;
    
    room.gameState.started = true;
    io.to(currentRoom).emit("game-started");
    startNewRound(currentRoom);
  });

  socket.on("chat-message", (message) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    const msgData = {
      sender: player.nickname,
      text: message,
      time: new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'})
    };
    
    room.chat.push(msgData);
    io.to(currentRoom).emit("new-chat-message", msgData);
  });

  socket.on("make-guess", (guess) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.gameState.started || room.gameState.finished) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.guessed) return;
    
    const country = room.gameState.currentCountry;
    const normGuess = guess.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const normCorrect = country[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const alternatives = country[3].map(a => a.toLowerCase());
    
    const correct = normGuess === normCorrect || alternatives.includes(normGuess);
    
    if (correct) {
      // Správná odpověď - přidělení bodů podle pořadí
      player.guessed = true;
      const finishOrder = room.gameState.winnersThisRound.length;
      const points = finishOrder === 0 ? 100 : (finishOrder === 1 ? 50 : (finishOrder === 2 ? 30 : 10));
      player.score += points;
      room.gameState.winnersThisRound.push(player.id);
      
      io.to(currentRoom).emit("player-guessed", {
        playerId: player.id,
        playerName: player.nickname,
        correct: true,
        points: points,
        position: finishOrder + 1,
        countryName: country[0]
      });
      
      checkRoundEnd(room);
    } else {
      // Špatná odpověď
      player.attempts++;
      if (player.attempts >= 5) {
        player.guessed = true; // Už nemůže hádat
        io.to(currentRoom).emit("player-out", {
          playerId: player.id,
          playerName: player.nickname
        });
        checkRoundEnd(room);
      } else {
        // Pouze dotyčnému pošleme že má špatně a má zoom
        socket.emit("wrong-guess", { attempts: player.attempts });
      }
    }
  });

  socket.on("request-rematch", () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    // Reset herního stavu ale zachovat hráče
    room.gameState.round = 1;
    room.gameState.started = false;
    room.gameState.finished = false;
    room.gameState.winnersThisRound = [];
    room.players.forEach(p => {
      p.score = 0;
      p.ready = false;
      p.guessed = false;
      p.attempts = 0;
    });
    
    io.to(currentRoom).emit("rematch-started", { players: room.players });
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        
        // Předání hosta dalšímu hráči
        if (disconnectedPlayer.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
        }
        
        if (room.players.length === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit("player-left", {
            players: room.players,
            message: `${disconnectedPlayer.nickname} se odpojil`
          });
          
          // Kontrola konce kola pokud byl ten kdo odešel aktivní
          if (room.gameState.started && !room.gameState.finished) {
            checkRoundEnd(room);
          }
          
          // Konec hry pokud zůstal jen jeden
          if (room.players.length === 1 && room.gameState.started) {
            endGame(room, "Ostatní hráči odešli");
          }
        }
      }
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
    room.gameState.winnersThisRound = [];
    room.players.forEach(p => {
      p.guessed = false;
      p.attempts = 0;
      p.ready = false;
    });
    
    io.to(code).emit("new-round", {
      round: room.gameState.round,
      country: country,
      players: room.players
    });
  }

  function checkRoundEnd(room) {
    const allFinished = room.players.every(p => p.guessed || p.attempts >= 5);
    
    if (allFinished && !room.gameState.finished) {
      room.gameState.finished = true;
      io.to(room.id).emit("round-end", {
        countryName: room.gameState.currentCountry[0],
        players: room.players
      });
      
      setTimeout(() => {
        room.gameState.round++;
        startNewRound(room.id);
      }, 5000);
    }
  }

  function endGame(room, reason = null) {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    io.to(room.id).emit("game-over", {
      players: sorted,
      winner: sorted[0],
      reason: reason
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server běží na portu", PORT);
});
