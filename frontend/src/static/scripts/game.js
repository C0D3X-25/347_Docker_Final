// @ts-nocheck
(() => {
    const scoreDiv = document.getElementById("score");
    const recordDiv = document.getElementById("record");
    const pressSpace = document.getElementById("press-space");
    const player = document.getElementById("player");
    const water = document.getElementById("water");
    const boat = document.getElementById("boat");
    const oxygenBar = document.getElementById("oxygen-bar");
    const menuContainer = document.getElementById("menu-container");
    const rotatePhone = document.getElementById("rotate-phone");
    const resume = document.getElementById("resume");
    const leaderboard = document.getElementById("leaderboard");
    const logout = document.getElementById("logout");
    const menu = document.getElementById("menu-icon-container");

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

    const playerSpeed = 3;
    const BOAT_SPEED = 60; // px per second
    const containerRows = [];
    const maxOxygen = 100;
    const movementKeys = new Set([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
    ]);
    const pressedKeys = new Set();

    let startPositionLeft = player.offsetLeft;
    let startPositionTop = player.offsetTop;
    let playing = false;
    let score = 0;
    let oxygen = maxOxygen;
    let spawner = null;
    let oxygenInterval = null;
    let movementFrame = null;
    let introInProgress = false;
    let menuWasPlaying = false;
    let boatAnimationFrame = null;
    let boatPosition = 0;
    let lastBoatTimestamp = null;

    class ContainerRow {
        htmlElement = null;
        rafId = null;
        lastFrame = null;
        positionY = 0;
        speed = 180; // pixels per second
        scored = false;
        emptySlot = null;

        constructor(element) {
            this.htmlElement = element;
            this.emptySlot = element.querySelector(".empty-slot");
            this.positionY = -this.htmlElement.getBoundingClientRect().height;
            this.htmlElement.style.transform = `translateY(${this.positionY}px)`;
            this.startMoveDown();
            containerRows.push(this);
        }

        isOutOfScreen = () => {
            const top = this.htmlElement.getBoundingClientRect().top;
            return top > window.innerHeight;
        };

        startMoveDown() {
            const step = (timestamp) => {
                if (!this.htmlElement) return;

                if (this.lastFrame === null) {
                    this.lastFrame = timestamp;
                }

                const delta = timestamp - this.lastFrame;
                this.lastFrame = timestamp;

                if (playing) {
                    this.positionY += (this.speed * delta) / 1000;
                    this.htmlElement.style.transform = `translateY(${this.positionY}px)`;

                    if (this.isOutOfScreen()) {
                        this.destroy();
                        return;
                    }

                    this.checkCollision();
                }

                this.rafId = requestAnimationFrame(step);
            };

            this.rafId = requestAnimationFrame(step);
        }

        stopMoveDown() {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
                this.lastFrame = null;
            }
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

        const emptySlot =
            Math.round(Math.random() * (numberOfContainer - 4)) + 2;

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
        if (playing || introInProgress) return;

        if (isCheating()) {
            alert("- ANTICHEAT -\nFerme ton gros mode développeur !");
            return;
        }

        pressSpace.style.display = "none";
        introInProgress = true;

        animatePlayerIntro().then(() => {
            introInProgress = false;
            playing = true;
            startSummoningContainers();
            startOxygenDrain();
            ensureMovementLoop();
        });
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
        introInProgress = false;
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

        positionPlayerBelowWater();
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
        if (introInProgress) return;

        const isOpen = menuContainer.style.display === "flex";

        if (isOpen) {
            menuContainer.style.display = "none";
            if (menuWasPlaying) {
                playing = true;
                ensureMovementLoop();
            }
            menuWasPlaying = false;
        } else {
            menuWasPlaying = playing;
            playing = false;
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

    const getOffscreenTop = () => {
        const parentEl = player.offsetParent || water || document.body;
        const parentHeight =
            parentEl && parentEl !== document.body
                ? parentEl.clientHeight
                : window.innerHeight;
        const playerHeight = player.getBoundingClientRect().height || 0;
        return parentHeight + playerHeight + 60;
    };

    const positionPlayerBelowWater = () => {
        player.style.transition = "none";
        player.style.left = startPositionLeft + "px";
        player.style.top = getOffscreenTop() + "px";
        player.style.opacity = "0";
        void player.offsetHeight;
    };

    const animatePlayerIntro = () => {
        return new Promise((resolve) => {
            positionPlayerBelowWater();

            requestAnimationFrame(() => {
                player.style.transition =
                    "top 1.2s cubic-bezier(0.23, 1, 0.32, 1)";
                // trigger layout before changing value
                void player.offsetHeight;
                player.style.opacity = "1";
                player.style.top = startPositionTop + "px";

                let resolved = false;
                const cleanup = () => {
                    if (resolved) return;
                    resolved = true;
                    player.style.transition = "";
                    player.removeEventListener("transitionend", cleanup);
                    resolve();
                };

                player.addEventListener("transitionend", cleanup, {
                    once: true,
                });
                setTimeout(cleanup, 1800); // safety in case transitionend doesn't fire
            });
        });
    };

    const ensureMovementLoop = () => {
        if (!movementFrame && playing && pressedKeys.size > 0) {
            movementFrame = requestAnimationFrame(stepMovement);
        }
    };

    const normalizeKey = (key) => (key.length === 1 ? key.toLowerCase() : key);

    const stepMovement = () => {
        if (!playing || pressedKeys.size === 0) {
            movementFrame = null;
            return;
        }

        const parentRect = player.offsetParent.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
        const initialLeft = playerRect.left - parentRect.left;
        const initialTop = playerRect.top - parentRect.top;
        const playerW = playerRect.width;
        const playerH = playerRect.height;

        const maxTop = Math.max(0, parentRect.height - playerH - 20);
        const maxLeft = Math.max(0, parentRect.width - playerW);

        let newTop = initialTop;
        let newLeft = initialLeft;
        let movedVertically = false;

        const upPressed = pressedKeys.has("ArrowUp") || pressedKeys.has("w");
        const downPressed =
            pressedKeys.has("ArrowDown") || pressedKeys.has("s");
        const leftPressed =
            pressedKeys.has("ArrowLeft") || pressedKeys.has("a");
        const rightPressed =
            pressedKeys.has("ArrowRight") || pressedKeys.has("d");

        if (upPressed && !downPressed) {
            newTop = Math.max(-40, initialTop - playerSpeed);
            movedVertically = true;
        } else if (downPressed && !upPressed) {
            newTop = Math.min(maxTop, initialTop + playerSpeed);
            movedVertically = true;
        }

        if (leftPressed && !rightPressed) {
            newLeft = Math.max(0, initialLeft - playerSpeed);
        } else if (rightPressed && !leftPressed) {
            newLeft = Math.min(maxLeft, initialLeft + playerSpeed);
        }

        if (newTop !== initialTop) {
            player.style.top = newTop + "px";
        }
        if (newLeft !== initialLeft) {
            player.style.left = newLeft + "px";
        }
        if (movedVertically) {
            updateOxygenBar();
        }

        movementFrame = requestAnimationFrame(stepMovement);
    };

    const isScreenPortrait = () => window.innerHeight > window.innerWidth;
    const isOnPhone = () => /Mobi|Android/i.test(navigator.userAgent);

    const toggleRotatePhone = (show) => {
        if (!rotatePhone) return;
        if (show) {
            pressSpace.style.display = "none";
            rotatePhone.style.display = "block";
        } else {
            pressSpace.style.display = "block";
            rotatePhone.style.display = "none";
        }
    };

    const getBoatWidth = () => {
        if (!boat) return 0;
        return boat.getBoundingClientRect().width || boat.naturalWidth || 160;
    };

    const resetBoatPosition = () => {
        if (!boat) return;
        boatPosition = -getBoatWidth();
        boat.style.left = `${boatPosition}px`;
    };

    const animateBoat = (timestamp) => {
        if (!boat) return;
        if (lastBoatTimestamp === null) {
            lastBoatTimestamp = timestamp;
        }

        const delta = timestamp - lastBoatTimestamp;
        lastBoatTimestamp = timestamp;

        boatPosition += (BOAT_SPEED * delta) / 1000;
        const travelSpan = window.innerWidth + getBoatWidth();

        if (boatPosition > travelSpan) {
            resetBoatPosition();
        } else {
            boat.style.left = `${boatPosition}px`;
        }

        boatAnimationFrame = requestAnimationFrame(animateBoat);
    };

    const startBoatAnimation = () => {
        if (!boat || boatAnimationFrame) return;
        resetBoatPosition();
        boatAnimationFrame = requestAnimationFrame(animateBoat);
    };

    if (boat) {
        if (boat.complete) {
            startBoatAnimation();
        } else {
            boat.addEventListener("load", startBoatAnimation, { once: true });
        }
    }

    if (isScreenPortrait()) {
        toggleRotatePhone(true);
    }

    const setUnsupportedMode = () => {
        scoreDiv.remove();
        recordDiv.remove();
        pressSpace.innerHTML =
            "Désolé, le jeu n'est pas encore disponible sur cette résolution.</br></br>Utilise un ordinateur pour jouer !";
    };

    if (isOnPhone()) {
        setUnsupportedMode();
    }

    window.addEventListener("resize", () => {
        if (isScreenPortrait()) {
            toggleRotatePhone(true);
        } else {
            toggleRotatePhone(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === " ") {
            event.preventDefault();
            startGame();
            return;
        }

        if (event.key === "Escape") {
            toggleMenu();
            return;
        }

        const normalizedKey = normalizeKey(event.key);
        if (!movementKeys.has(normalizedKey)) return;

        event.preventDefault();
        pressedKeys.add(normalizedKey);
        ensureMovementLoop();
    });

    document.addEventListener("keyup", (event) => {
        const normalizedKey = normalizeKey(event.key);
        if (!movementKeys.has(normalizedKey)) return;
        pressedKeys.delete(normalizedKey);
    });

    menu.addEventListener("click", toggleMenu);
    resume.addEventListener("click", toggleMenu);
    leaderboard.addEventListener("click", goToLeaderboard);
    logout.addEventListener("click", logOut);

    // Hide player below water until first game starts
    positionPlayerBelowWater();
})();
