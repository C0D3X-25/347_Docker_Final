// @ts-nocheck
const scoreDiv = document.getElementById("score");
const recordDiv = document.getElementById("record");
const pressSpace = document.getElementById("press-space");
const player = document.getElementById("player");
const water = document.getElementById("water");
const oxygenBar = document.getElementById("oxygen-bar");

const container = new Image();
container.src = "/static/assets/container.png";

const deadByOxygenMsgs = [
    "Tu manques pas d'air !",
    "Respire un bon coup !",
    "L'oxygène, c'est la vie !",
];
const deadByCollisionMsgs = [
    "Prends pas la grosse tête !",
    "Tape pas contre le mur gros !",
    "Améliore ton doigté !",
];

const playerSpeed = 20;
const containerRows = [];
const maxOxygen = 100;

let startPositionLeft = 0;
let startPositionTop = 0;
let playing = false;
let score = 0;
let oxygen = maxOxygen;
let spawner = null;
let oxygenInterval = null;

class ContainerRow {
    htmlElement = null;
    moveDownInterval = null;
    scored = false;
    emptySlot = null;

    constructor(element) {
        this.htmlElement = element;
        this.emptySlot = element.querySelector(".empty-slot");
        this.startMoveDown();
        containerRows.push(this);
    }

    isOutOfScreen = () => {
        const top = this.htmlElement.getBoundingClientRect().top;
        return top > window.innerHeight;
    };

    startMoveDown() {
        this.moveDownInterval = setInterval(() => {
            if (!playing) return;

            if (this.isOutOfScreen()) {
                this.stopMoveDown();
                this.destroy();
            } else {
                this.moveDown();
                this.checkCollision();
            }
        }, 25);
    }

    stopMoveDown() {
        if (this.moveDownInterval) {
            clearInterval(this.moveDownInterval);
            this.moveDownInterval = null;
        }
    }

    moveDown() {
        const top = this.htmlElement.getBoundingClientRect().top;
        this.htmlElement.style.top = top + 5 + "px";
    }

    destroy() {
        this.stopMoveDown();
        if (!this.htmlElement) return;
        this.htmlElement.remove();
        this.htmlElement = null;
    }

    checkCollision() {
        const playerRect = player.getBoundingClientRect();
        const containers =
            this.htmlElement.getElementsByClassName("container-item");
        const emptySlotRect = this.emptySlot?.getBoundingClientRect();

        for (let container of containers) {
            const containerRect = container.getBoundingClientRect();

            if (
                playerRect.left < containerRect.right &&
                playerRect.right > containerRect.left &&
                playerRect.top < containerRect.bottom &&
                playerRect.bottom > containerRect.top
            ) {
                endGame("collision");
            }
        }

        if (
            emptySlotRect &&
            playerRect.bottom < emptySlotRect.top &&
            !this.scored
        ) {
            this.scored = true;
            updateScore();
        }
    }
}

const isCheating = () => window.innerWidth < window.outerWidth - 50;

const updateOxygenBar = () => {
    if (isPlayerAboveWater()) {
        oxygen = 100;
        oxygenBar.value = oxygen;
    }
};

const isPlayerAboveWater = () => player.style.top.replace("px", "") < 0;

const buildRow = () => {
    const numberOfContainer = Math.ceil(window.innerWidth / 120);
    const row = document.createElement("div");
    row.className = "container-row";

    const emptySlot = Math.round(Math.random() * (numberOfContainer - 4)) + 2;

    for (let i = 0; i <= numberOfContainer; i++) {
        if (i == emptySlot) {
            const emptyDiv = document.createElement("div");
            emptyDiv.classList.add("empty-slot");
            emptyDiv.style.width = "120px";
            row.appendChild(emptyDiv);
        } else {
            const img = new Image();
            img.src = container.src;
            img.width = 120;
            img.className = "container-item";
            row.appendChild(img);
        }
    }

    const water = document.getElementById("water") || document.body;
    water.appendChild(row);

    return new ContainerRow(row);
};

const resetScore = () => {
    score = 0;
    scoreDiv.textContent = "Score: " + score;
};

const updateScore = () => {
    score++;
    scoreDiv.textContent = "Score: " + score;
};

const getBestScore = () => {
    return parseInt(recordDiv.textContent.replace("Best Score: ", "")) || 0;
};

const updateBestScore = (score) => {
    recordDiv.textContent = "Best Score: " + score;
};

const startGame = () => {
    if (playing) return;

    if (isCheating()) {
        alert("- ANTICHEAT -\nFerme ton gros mode développeur !");
        return;
    }

    playing = true;
    pressSpace.style.display = "none";

    startPositionLeft = player.offsetLeft;
    startPositionTop = player.offsetTop;

    startSummoningContainers();
    startOxygenDrain();
};

const startSummoningContainers = () => {
    buildRow();
    spawner = setInterval(() => {
        if (playing) {
            buildRow();
        }
    }, 2500);
};

const startOxygenDrain = () => {
    oxygenInterval = setInterval(() => {
        if (playing) {
            oxygen -= 10;
            oxygenBar.value = oxygen;
            if (oxygen <= 0) {
                endGame("oxygen");
            }
        }
    }, 1000);
};

const endGame = (reason) => {
    playing = false;
    clearInterval(spawner);
    clearInterval(oxygenInterval);

    oxygen = 100;
    oxygenBar.value = oxygen;

    updateMainMessage(score, reason);
    postScore(score);
    resetScore();

    for (let container of containerRows) {
        container.destroy();
    }
    containerRows.length = 0;

    player.style.left = startPositionLeft + "px";
    player.style.top = startPositionTop + "px";
};

const updateMainMessage = (score, reason) => {
    let msg = "";

    if (reason === "oxygen") {
        msg =
            deadByOxygenMsgs[
                Math.floor(Math.random() * deadByOxygenMsgs.length)
            ];
    } else if (reason === "collision") {
        msg =
            deadByCollisionMsgs[
                Math.floor(Math.random() * deadByCollisionMsgs.length)
            ];
    }

    pressSpace.innerHTML =
        msg + "<br>" + "Score: " + score + "<br><br>Press start to respace";
    pressSpace.style.display = "block";
};

const toggleMenu = () => {
    playing = !playing;

    const menuContainer = document.getElementById("menu-container");
    if (menuContainer.style.display === "flex") {
        menuContainer.style.display = "none";
    } else {
        menuContainer.style.display = "flex";
    }
};

const postScore = async (score) => {
    await fetch("/scores", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ score: score }),
    }).then((response) => {
        if (response.status === 201 && score > getBestScore()) {
            updateBestScore(score);
        }
    });
};

const goToLeaderboard = () => {
    window.location.href = "/leaderboard";
};

const logOut = () => {
    window.location.href = "/logout";
};

document.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        startGame();
    }

    if (event.key === "Escape") {
        toggleMenu();
    }

    if (!playing) return;

    const parentRect = player.offsetParent.getBoundingClientRect();

    const playerRect = player.getBoundingClientRect();
    const left = playerRect.left - parentRect.left;
    const top = playerRect.top - parentRect.top;
    const playerW = playerRect.width;
    const playerH = playerRect.height;

    const maxTop = Math.max(0, parentRect.height - playerH - 20);
    const maxLeft = Math.max(0, parentRect.width - playerW);

    switch (event.key) {
        case "ArrowUp":
        case "w":
            player.style.top = Math.max(-40, top - playerSpeed) + "px";
            updateOxygenBar();
            break;
        case "ArrowDown":
        case "s":
            player.style.top = Math.min(maxTop, top + playerSpeed) + "px";
            updateOxygenBar();
            break;
        case "ArrowLeft":
        case "a":
            player.style.left = Math.max(0, left - playerSpeed) + "px";
            break;
        case "ArrowRight":
        case "d":
            player.style.left = Math.min(maxLeft, left + playerSpeed) + "px";
            break;
    }
});
