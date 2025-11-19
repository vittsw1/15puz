document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const winScreen = document.getElementById('win-screen');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const title = document.getElementById('level-title');
    
    const size = 4; 
    let currentLevel = 1;
    let tiles = [];
    let solvedState = Array.from({length: size * size}, (_, i) => i); // [0, 1, ... 15]
    let currentState = [];

    // Avvio iniziale
    loadImageAndStart(currentLevel);

    // Gestione click "Prossimo Livello"
    nextLevelBtn.addEventListener('click', () => {
        winScreen.classList.add('hidden');
        currentLevel++;
        loadImageAndStart(currentLevel);
    });

    function loadImageAndStart(level) {
        const imgName = `img_puzzle${level}.jpg`;
        const imgTester = new Image();
        
        // Mostra loading o feedback visivo se vuoi, qui lo facciamo rapido
        imgTester.onload = function() {
            // Se l'immagine esiste, impostala e avvia
            document.documentElement.style.setProperty('--current-image', `url('${imgName}')`);
            title.textContent = `Livello ${level}`;
            initGame();
        };

        imgTester.onerror = function() {
            // Se l'immagine NON esiste (siamo arrivati alla fine), torna alla 1
            console.log("Immagine non trovata, torno al livello 1");
            currentLevel = 1;
            loadImageAndStart(1); // Ricorsione sicura verso la 1
        };

        imgTester.src = imgName;
    }

    function initGame() {
        currentState = [...solvedState];
        // Mescola finché non è risolvibile e non è già risolto
        do {
            shuffle(currentState);
        } while (!isSolvable(currentState) || isSolved());
        
        renderBoard();
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Controllo risolvibilità (inversioni)
    function isSolvable(arr) {
        let inversions = 0;
        const emptyIndex = arr.indexOf(15); 
        const emptyRowFromBottom = size - Math.floor(emptyIndex / size);

        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[i] !== 15 && arr[j] !== 15 && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }

        if (emptyRowFromBottom % 2 === 0) return inversions % 2 === 1;
        else return inversions % 2 === 0;
    }

    function isSolved() {
        return currentState.every((val, index) => val === solvedState[index]);
    }

    function renderBoard() {
        board.innerHTML = '';
        currentState.forEach((val, index) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            
            // Posiziona lo sfondo
            const row = Math.floor(val / size);
            const col = val % size;
            const bgX = col * (100 / (size - 1));
            const bgY = row * (100 / (size - 1));
            tile.style.backgroundPosition = `${bgX}% ${bgY}%`;

            // Aggiungi il numero sovrapposto
            // Nota: val va da 0 a 14. Aggiungiamo 1 per mostrare 1-15.
            if (val !== 15) {
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
        const emptyIndex = currentState.indexOf(15);
        const row = Math.floor(index / size);
        const col = index % size;
        const emptyRow = Math.floor(emptyIndex / size);
        const emptyCol = emptyIndex % size;

        // Controlla adiacenza
        if (Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1) {
            // Scambia
            [currentState[index], currentState[emptyIndex]] = [currentState[emptyIndex], currentState[index]];
            renderBoard();
            
            // Controlla vittoria dopo render (per aggiornare UI)
            // Piccolo timeout per permettere all'occhio di vedere l'ultimo movimento
            if (isSolved()) {
                setTimeout(handleWin, 150);
            }
        }
    }

    function handleWin() {
        // Mostra il pezzo mancante
        const emptyTile = document.getElementById('empty-tile');
        if (emptyTile) {
            emptyTile.classList.remove('empty');
            emptyTile.innerHTML = ''; // Rimuovi eventuali numeri se presenti per sbaglio (non dovrebbero esserci)
        }
        
        // Mostra schermata vittoria
        setTimeout(() => {
            winScreen.classList.remove('hidden');
        }, 500);
    }
});