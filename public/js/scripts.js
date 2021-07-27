import createGame from "./game.js";
import createKeyboardListener from "./keyboard-listener.js";
import renderScreen from "./render-screen.js";


document.getElementById("color").value = "#" + Math.floor(Math.random() * 0xffffff).toString(16);
document.getElementById("form").onsubmit = (event) => {
	event.preventDefault();
	const nickname = document.getElementById("nickname").value;
	const color = document.getElementById("color").value;
	const user = {
		nickname,
		color,
	};
	conectar(user);
	mostrarTela(document.getElementById("jogo"));
};

const screen = document.getElementById("tela");
const allScreens = [document.getElementById("connect"), document.getElementById("jogo")]; 
let mostrarTela = (screen) => {
	for (let s of allScreens) {
		s.style.display = "none";
	}
	screen.style.display = null;
};


let conectar = (userData) => {
	const game = createGame();
	const keyboardListener = createKeyboardListener(document);
	const socket = io();
	let playerId = null;

	socket.on("connect", () => {
		playerId = socket.id;
		renderScreen(screen, game, requestAnimationFrame, playerId);
		socket.emit("join-player", userData);
		console.log(`Player connected on Client with id: ${playerId}`);
	});

	socket.on("setup", (state) => {
		game.setState(state);

		keyboardListener.registerPlayerId(playerId);
		keyboardListener.subscribe(game.movePlayer);
		keyboardListener.subscribe((command) => {
			socket.emit("move-player", command);
		});
	});

	socket.on("add-player", (command) => {
		game.addPlayer(command);
		atualizarPlacar(game);
	});

	socket.on("remove-player", (command) => {
		game.removePlayer(command);
		atualizarPlacar(game);
	});

	socket.on("move-player", (command) => {
		const playerId = socket.id;
		if (playerId !== command.playerId) {
			game.movePlayer(command);
		}
	});

	socket.on("add-fruit", (command) => {
		game.addFruit(command);
	});

	socket.on("remove-fruit", (command) => {
		game.removeFruit(command);
	});

	socket.on("placar-player", (command) => {
		const player = game.state.players[command.playerId];
		if (player == null) {
			return;
		}
		atualizarPlacar(game);
	});

	socket.on("disconnect", (command) => {
		keyboardListener.resetObservers();
	});
};

let atualizarPlacar = (game) => {
	const players = [];
	for (let playerA of Object.values(game.state.players)) {
		let posi = -1;
		let index = 0;
		for (let playerB of players) {
			if (playerA.score > playerB.score) {
				posi = index;
				break;
			}
			index++;
		}
		if (posi == -1 && players.length < 10) {
			posi = players.length;
		}
		if (posi != -1) {
			players.splice(posi, 0, playerA);

			if (players.length > 10) {
				players.splice(10, 1);
			}
		}
	}
	let posi = 1;
	let tags =
		'<span style="font-size: large; font-weight: bold; padding-bottom: 8px;">Placar de Pontos<br></span>\n';
	for (let player of players) {
		tags +=	'<span class="pontuacao"> <div class="cor" style="background-color: ' +	player.color + '"></div>'+ posi + 'º' + player.nickname + " (" +player.score +
			" pontos) <br> </span>\n";
		posi++;
	}
	document.getElementById("placar").innerHTML = tags;
};