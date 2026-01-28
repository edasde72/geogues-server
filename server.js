function broadcastResult(room, roundWinner) {
  const isFinal = room.gameState.round >= 5;
  
  // Výsledek kola (kdo uhodl tuto zemi)
  io.to(room.host).emit("round-result", {
    winner: roundWinner,
    isHost: true,
    countryName: room.gameState.currentCountry[0],
    hostScore: room.gameState.hostScore,
    guestScore: room.gameState.guestScore,
    isFinal
  });
  
  io.to(room.guest).emit("round-result", {
    winner: roundWinner,
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
    // KONEC HRY - určení celkového vítěze podle skóre!
    let gameWinner;
    if (room.gameState.hostScore > room.gameState.guestScore) {
      gameWinner = "host";
    } else if (room.gameState.hostScore < room.gameState.guestScore) {
      gameWinner = "guest";
    } else {
      gameWinner = "draw";
    }
    
    setTimeout(() => {
      io.to(room.host).emit("game-over", {
        winner: gameWinner,  // ← Tady je oprava - gameWinner místo roundWinner
        isHost: true,
        hostScore: room.gameState.hostScore,
        guestScore: room.gameState.guestScore
      });
      io.to(room.guest).emit("game-over", {
        winner: gameWinner,  // ← Tady taky gameWinner
        isHost: false,
        hostScore: room.gameState.hostScore,
        guestScore: room.gameState.guestScore
      });
    }, 5000);
  }
}
