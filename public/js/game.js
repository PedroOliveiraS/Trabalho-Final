export default () => {
	const state = {
		players: {},
		fruits: {},
		screen: {
			width: 10,
			height: 10,
		},
	};

	const observers = [];
	const options = {
		spawnFrequency: 2000,
	};

	let start = (_options) => {
		if (_options) Object.assign(options, _options);

		let spawnFruit = () => {
			addFruit();
		};
		setInterval(spawnFruit, options.spawnFrequency);
	};

	let subscribe = (observerFunction) => {
		observers.push(observerFunction);
	};

	let notifyAll = (command) => {
		for (const observerFunction of observers) {
			observerFunction(command);
		}
	};

	let setState = (newState) => {
		Object.assign(state, newState);
	};

	let addPlayer = (command) => {
		const playerId = command.playerId;

		const player = {
			playerId,
			x: "x" in command ? command.x : Math.floor(Math.random() * state.screen.width),
			y: "y" in command ? command.y : Math.floor(Math.random() * state.screen.height),
			nickname: "nickname" in command ? command.nickname : "unknown",
			color: "color" in command ? command.color : "red",
			score: 0,
		};

		state.players[playerId] = player;

		notifyAll({
			type: "add-player",
			...player,
		});
	};

	let removePlayer = (command) => {
		const playerId = command.playerId;

		delete state.players[playerId];

		notifyAll({
			type: "remove-player",
			playerId: playerId,
		});
	};

	let addFruit = (command) => {
		const fruitId = command ? command.fruitId : Math.floor(Math.random() * 10000000);
		const fruitX = command ? command.fruitX : Math.floor(Math.random() * state.screen.width);
		const fruitY = command ? command.fruitY : Math.floor(Math.random() * state.screen.height);

		state.fruits[fruitId] = {
			x: fruitX,
			y: fruitY,
		};

		notifyAll({
			type: "add-fruit",
			fruitId: fruitId,
			fruitX: fruitX,
			fruitY: fruitY,
		});
	};

	let removeFruit = (command) => {
		const fruitId = command.fruitId;

		delete state.fruits[fruitId];

		notifyAll({
			type: "remove-fruit",
			fruitId: fruitId,
		});
	};

	let movePlayer = (command) => {
		notifyAll(command);

		const acceptedMoves = {
			ArrowUp(player) {
				if (player.y - 1 >= 0) {
					player.y = player.y - 1;
				}
			},
			ArrowRight(player) {
				if (player.x + 1 < state.screen.width) {
					player.x = player.x + 1;
				}
			},
			ArrowDown(player) {
				if (player.y + 1 < state.screen.height) {
					player.y = player.y + 1;
				}
			},
			ArrowLeft(player) {
				if (player.x - 1 >= 0) {
					player.x = player.x - 1;
				}
			},
		};

		const keyPressed = command.keyPressed;
		const playerId = command.playerId;
		const player = state.players[playerId];
		const moveFunction = acceptedMoves[keyPressed];

		if (player && moveFunction) {
			moveFunction(player);
			checkForFruitCollision(playerId);
		}
	};

	let checkForFruitCollision = (playerId) => {
		const player = state.players[playerId];

		for (const fruitId in state.fruits) {
			const fruit = state.fruits[fruitId];

			if (player.x === fruit.x && player.y === fruit.y) {
				removeFruit({ fruitId: fruitId });

				notifyAll({
					type: "placar-player",
					playerId,
					score: ++player.score,
				});
			}
		}
	};

	return {
		addPlayer,
		removePlayer,
		movePlayer,
		addFruit,
		removeFruit,
		state,
		setState,
		subscribe,
		start,
	};
};
