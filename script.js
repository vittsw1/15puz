document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const winScreen = document.getElementById('win-screen');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const title = document.getElementById('level-title');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    const moveSound = document.getElementById('move-sound');
    const backgroundMusic = document.getElementById('background-music');
    
    const muteButton = document.getElementById('mute-button');
    const muteIcon = document.getElementById('mute-icon');     

    let currentLevel = 1;
    let currentGridSize; 
    let tiles = [];
    let solvedState = []; 
    let currentState = [];
    let isMuted = false;
    let musicStarted = false; // Flag per controllare se la musica è già partita


    // --- NUOVA LOGICA PER L'AUTOPLAY DELLA MUSICA ---
    // Avvia la musica solo dopo la prima interazione dell'utente con la pagina
    function startBackgroundMusic() {
        if (!musicStarted && !isMuted) {
            backgroundMusic.volume = 0.4;
            backgroundMusic.loop = true; // Assicurati che sia in loop
            backgroundMusic.muted = false; // Assicurati che non sia muta all'inizio
            backgroundMusic.play().then(() => {
                musicStarted = true;
                console.log("Musica di sottofondo avviata con successo.");
            }).catch(e => {
                console.error("Impossibile avviare la musica di sottofondo (potrebbe essere bloccato dall'autoplay):", e);
            });
        }
    }

    // Aggiungi un listener al body che si attiva solo una volta
    document.body.addEventListener('click', startBackgroundMusic, { once: true });
    document.body.addEventListener('touchstart', startBackgroundMusic, { once: true }); // Per dispositivi touch


    loadImageAndStart(currentLevel);

    nextLevelBtn.addEventListener('click', () => {
        winScreen.classList.add('hidden');
        currentLevel++;
        loadImageAndStart(currentLevel);
    });

    muteButton.addEventListener('click', () => {
        isMuted = !isMuted; 
        moveSound.muted = isMuted; 
        backgroundMusic.muted = isMuted; 
        muteIcon.textContent = isMuted ? '🔇' : '🔊'; 
        muteButton.setAttribute('aria-label', isMuted ? 'Attiva audio' : 'Disattiva audio');
        
        // Se si demuta, prova a far partire la musica (se non era già partita)
        if (!isMuted && !musicStarted) {
             startBackgroundMusic(); // Prova ad avviarla
        } else if (!isMuted && backgroundMusic.paused) {
             // Se era già partita ma in pausa (es. utente l'ha messa in pausa manualmente)
             backgroundMusic.play().catch(e => console.log("Errore riproduzione musica al demute:", e));
        }
    });

    function loadImageAndStart(level) {
        loadingOverlay.classList.remove('hidden');

        currentGridSize = (level === 1) ? 3 : 4;
        document.documentElement.style.setProperty('--current-grid-size', currentGridSize);

        solvedState = Array.from({length: currentGridSize * currentGridSize}, (_, i) => i);
        
        const imgName = `img_puzzle${level}.jpg`;
        const imgTester = new Image();
        
        imgTester.onload = function() {
            document.documentElement.style.setProperty('--current-image', `url('${imgName}')`);
            title.textContent = `Tile Puzzle - Livello ${level} (${currentGridSize}x${currentGridSize})`;
            initGame();
            loadingOverlay.classList.add('hidden');
        };

        imgTester.onerror = function() {
            console.log(`Immagine ${imgName} non trovata, torno al livello 1`);
            currentLevel = 1;
            loadImageAndStart(1); 
        };

        imgTester.src = imgName;
    }

    function initGame() {
        currentState = [...solvedState];
        const emptyTileValue = (currentGridSize * currentGridSize) - 1;

        do {
            shuffle(currentState);
        } while (!isSolvable(currentState, currentGridSize) || isSolved());
        
        renderBoard();
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function isSolvable(arr, size) {
        let inversions = 0;
        const emptyTileValue = (size * size) - 1; 
        const emptyIndex = arr.indexOf(emptyTileValue); 
        const emptyRowFromBottom = size - Math.floor(emptyIndex / size);

        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[i] !== emptyTileValue && arr[j] !== emptyTileValue && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }
        
        if (size % 2 === 1) { 
            return inversions % 2 === 0;
        } else { 
            if (emptyRowFromBottom % 2 === 1) { 
                return inversions % 2 === 0;
            } else { 
                return inversions % 2 === 1;
            }
        }
    }

    function isSolved() {
        return currentState.every((val, index) => val === solvedState[index]);
    }

    function renderBoard() {
        board.innerHTML = '';
        const emptyTileValue = (currentGridSize * currentGridSize) - 1;

        currentState.forEach((val, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            
            const row = Math.floor(val / currentGridSize);
            const col = val % currentGridSize;
            
            const bgX = col * (100 / (currentGridSize - 1));
            const bgY = row * (100 / (currentGridSize - 1));
            tile.style.backgroundPosition = `${bgX}% ${bgY}%`;

            if (val !== emptyTileValue) {
                const numSpan = document.createElement('span');
                numSpan.classList.add('number');
                numSpan.textContent = val + 1; 
                tile.appendChild(numSpan);
                
                tile.addEventListener('click', () => moveTile(index));
            } else {
                tile.classList.add('empty');
                tile.id = 'empty-tile';
            }

            board.appendChild(tile);
        });
    }

    function moveTile(index) {
        const emptyTileValue = (currentGridSize * currentGridSize) - 1;
        const emptyIndex = currentState.indexOf(emptyTileValue);
        
        const row = Math.floor(index / currentGridSize);
        const col = index % currentGridSize;
        const emptyRow = Math.floor(emptyIndex / currentGridSize);
        const emptyCol = emptyIndex % currentGridSize;

        if (Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1) {
            // Se la musica non è ancora partita, falla partire al primo click utile
            if (!musicStarted) {
                startBackgroundMusic();
            }

            if (moveSound && !isMuted) { 
                moveSound.currentTime = 0;
                moveSound.play().catch(e => console.log("Errore riproduzione audio:", e));
            }

            [currentState[index], currentState[emptyIndex]] = [currentState[emptyIndex], currentState[index]];
            renderBoard();
            
            if (isSolved()) {
                setTimeout(handleWin, 150);
            }
        }
    }

    function handleWin() {
        const emptyTile = document.getElementById('empty-tile');
        if (emptyTile) {
            emptyTile.classList.remove('empty');
            emptyTile.innerHTML = '';
        }
        
        setTimeout(() => {
            winScreen.classList.remove('hidden');
        }, 500);
    }
});