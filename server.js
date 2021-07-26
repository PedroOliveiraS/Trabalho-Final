import express from "express";
import http from "http";
import createGame from "./public/js/game.js";
import socketio from "socket.io";

const app = express();
const server = http.createServer(app);
const sockets = socketio(server);

app.use(express.static("public"));

const game = createGame();
game.start();

game.subscribe((command) => {
	//console.log(`Executando: ${command.type}`);
	sockets.emit(command.type, command);
});

sockets.on("connection", (socket) => {
	const playerId = socket.id;

	socket.on("join-player", (command) => {
		console.log(`> Jogador conectado: ${command.nickname} (${playerId})`);

		game.addPlayer({
			playerId: playerId,
			nickname: command.nickname,
			color: command.color,
		});

		socket.emit("setup", game.state);
	});

	socket.on("move-player", (command) => {
		command.playerId = playerId;
		command.type = "move-player";

		game.movePlayer(command);
	});

	socket.on("disconnect", () => {
		console.log(`> Jogador desconectado: ${game.state.players[playerId].nickname} (${playerId})`);
		game.removePlayer({ playerId: playerId });
	});
});

server.listen(3000, () => {
	console.log(`> Servidor ligado na porta: 3000`);
});
