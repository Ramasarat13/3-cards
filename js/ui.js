import { SoundManager } from './sound.js';

export class UI {
    constructor() {
        this.app = document.getElementById('app');
        this.drawCallback = null;
        this.selectedCardIndices = [];
        this.sound = new SoundManager();
    }

    showMainMenu(onStart) {
        this.app.innerHTML = `
            <div class="start-screen">
                <div class="game-logo">
                    <div class="logo-card card-1">
                        <img src="https://deckofcardsapi.com/static/img/AS.png" alt="Ace of Spades">
                    </div>
                    <div class="logo-card card-2">
                        <img src="https://deckofcardsapi.com/static/img/KH.png" alt="King of Hearts">
                    </div>
                    <div class="logo-card card-3">
                        <img src="https://deckofcardsapi.com/static/img/QD.png" alt="Queen of Diamonds">
                    </div>
                </div>
                
                <h1 class="main-title">3 Cards</h1>
                
                <div class="start-controls">
                    <button id="start-btn" class="btn primary big-btn">Start Game</button>
                    <button id="rules-btn" class="btn secondary big-btn">How to Play</button>
                </div>
            </div>

            <div id="rules-overlay" class="overlay hidden">
                <div class="overlay-content">
                    <h2>How to Play</h2>
                    <ul>
                        <li>Goal: Keep your points low!</li>
                        <li>J, Q, K = 10 pts, A = 1 pt.</li>
                        <li>Turn: Discard 1 card, then Draw 1 card.</li>
                        <li>"Show" if you think you have lower points than computer.</li>
                        <li>Lowest points wins the round (0 pts). Loser gets hand value.</li>
                        <li>Wrong Show penalty: +30 pts.</li>
                        <li>Game ends when someone hits 100 pts.</li>
                    </ul>
                    <button id="close-rules" class="btn primary">Close</button>
                </div>
            </div>
        `;
        document.getElementById('start-btn').addEventListener('click', onStart);

        const rulesOverlay = document.getElementById('rules-overlay');
        document.getElementById('rules-btn').addEventListener('click', () => {
            rulesOverlay.classList.remove('hidden');
        });
        document.getElementById('close-rules').addEventListener('click', () => {
            rulesOverlay.classList.add('hidden');
        });
    }

    renderGame(game) {
        // If game container doesn't exist, create it
        if (!document.getElementById('game-board')) {
            this.app.innerHTML = `
                <div class="bg-layer"></div>
                <div class="bg-overlay"></div>
                
                <div class="top-bar">
                    <div class="game-title">
                        <span>🎴 3 Cards</span>
                    </div>
                    <div id="menu-btn" class="icon-box">
                        <span style="font-size: 20px; color: white;">☰</span>
                    </div>
                </div>

                <div class="score-board">
                    <div class="score-pill glass">
                        <div class="label">You</div>
                        <div class="value" id="player-score">0</div>
                    </div>
                    <div class="score-pill glass">
                        <div class="label">Computer</div>
                        <div class="value" id="comp-score">0</div>
                    </div>
                </div>

                <div id="toast-msg" class="toast glass-dark"></div>

                <div id="game-board">
                    <div class="computer-area">
                        <div id="computer-hand" class="hand"></div>
                    </div>

                    <div class="center-area">
                        <div class="deck-container">
                            <div id="deck" class="card card-back">
                                <img src="https://deckofcardsapi.com/static/img/back.png" class="card-image" alt="Deck">
                            </div>
                            <div class="deck-label">Deck</div>
                        </div>
                        <div class="discard-container">
                            <div id="discard-pile" class="discard-pile"></div>
                            <div class="deck-label">Discard</div>
                        </div>
                    </div>

                    <div class="player-area">
                        <div id="player-hand" class="hand"></div>
                    </div>

                    <div class="controls-bar">
                        <button id="discard-btn" class="btn primary" disabled>Discard</button>
                        <button id="show-btn" class="btn secondary" disabled>Show</button>
                    </div>
                </div>

                <div id="overlay" class="overlay hidden"></div>
            `;

            // Re-attach menu listener
            document.getElementById('menu-btn').addEventListener('click', () => {
                this.showInGameMenu(game);
            });

            document.getElementById('show-btn').addEventListener('click', () => {
                // Debug log
                // this.log("Show clicked. Turns: " + game.turnsPlayed);

                if (game.turnsPlayed < 2) {
                    this.log("Cannot show on first turn!");
                    return;
                }
                game.playerShow();
            });

            document.getElementById('discard-btn').addEventListener('click', () => {
                if (this.selectedCardIndices.length > 0) {
                    game.playerDiscard(this.selectedCardIndices);
                    this.selectedCardIndices = [];
                }
            });

            document.getElementById('deck').addEventListener('click', () => {
                if (this.drawCallback) {
                    this.drawCallback(false); // Draw from deck
                    this.disableDrawActions();
                }
            });

            document.getElementById('discard-pile').addEventListener('click', () => {
                if (this.drawCallback) {
                    this.drawCallback(true); // Draw from discard
                    this.disableDrawActions();
                }
            });
        }

        // Update Scores
        document.getElementById('comp-score').textContent = game.players[1].score;
        document.getElementById('player-score').textContent = game.players[0].score;

        // Turn Indicator
        if (game.currentPlayerIndex === 0) {
            this.log("Your Turn");
        } else {
            this.log("Computer's Turn");
        }
        // document.getElementById('round-num').textContent = game.round; // Removed as element doesn't exist

        // Update Controls
        const showBtn = document.getElementById('show-btn');
        const discardBtn = document.getElementById('discard-btn');

        const isPlayerTurn = game.currentPlayerIndex === 0;
        const waitingForDraw = !!this.drawCallback;
        // const canShow = game.turnsPlayed >= 2; // Rule enforced in click handler now

        showBtn.disabled = false; // Always enabled visually

        if (isPlayerTurn && !waitingForDraw) {
            // Discard enabled logic handled below
        } else {
            discardBtn.disabled = true;
        }

        // Validate Discard Selection
        if (isPlayerTurn && !waitingForDraw) {
            const isValidDiscard = this.validateDiscard(game.players[0]);
            discardBtn.disabled = !isValidDiscard;
        }

        // Render Hands
        this.renderHand(game.players[1], false, document.getElementById('computer-hand'));
        this.renderHand(game.players[0], true, document.getElementById('player-hand'), game);

        // Render Discard Pile
        const discardEl = document.getElementById('discard-pile');
        discardEl.innerHTML = '';
        if (game.discardPile.length > 0) {
            const topCard = game.discardPile[game.discardPile.length - 1];
            // Discard pile cards should be face up
            const cardEl = this.createCardEl(topCard, false);
            // No animation for discard pile static view usually, or simple fade
            discardEl.appendChild(cardEl);
        }
    }

    validateDiscard(player) {
        if (this.selectedCardIndices.length === 0) return false;

        // Get the first selected card
        const firstIndex = this.selectedCardIndices[0];
        const firstCard = player.hand[firstIndex];

        if (!firstCard) {
            console.error("Selected card not found in hand");
            return false;
        }

        // Check if all other selected cards match the rank of the first one
        for (let i = 1; i < this.selectedCardIndices.length; i++) {
            const idx = this.selectedCardIndices[i];
            const card = player.hand[idx];

            if (!card) {
                console.error("Selected card not found in hand");
                return false;
            }

            if (card.rank !== firstCard.rank) {
                return false;
            }
        }

        return true;
    }

    renderHand(player, isPlayer, container, game, forceFaceUp = false) {
        const existingEls = {};
        Array.from(container.children).forEach(el => {
            if (el.dataset.id) existingEls[el.dataset.id] = el;
        });

        player.hand.forEach((card, index) => {
            let cardEl = existingEls[card.id];
            const shouldBeFaceDown = !isPlayer && !forceFaceUp;

            if (cardEl) {
                // Check if we need to flip existing card
                const isCurrentlyFaceDown = cardEl.classList.contains('card-back');
                if (isCurrentlyFaceDown && !shouldBeFaceDown) {
                    this.flipCard(cardEl, card);
                } else if (!isCurrentlyFaceDown && shouldBeFaceDown) {
                    // Force face down if it should be hidden
                    cardEl.classList.add('card-back');
                    cardEl.innerHTML = '<img src="https://deckofcardsapi.com/static/img/back.png" class="card-image" alt="Back">';
                }

                // Update selection state only
                if (isPlayer) {
                    if (this.selectedCardIndices.includes(index)) {
                        cardEl.classList.add('selected');
                    } else {
                        cardEl.classList.remove('selected');
                    }
                }
                delete existingEls[card.id];
            } else {
                // Create new
                // For player: Render face up immediately (no animation)
                // For computer: Render face down (unless forceFaceUp)

                const isFaceDown = !isPlayer && !forceFaceUp;
                cardEl = this.createCardEl(card, isFaceDown);

                // No entrance animation requested
                // cardEl.classList.add(isPlayer ? 'enter-bottom' : 'enter-top');
                // cardEl.style.animationDelay = `${index * 0.2}s`;

                // this.sound.playCardFlip(); // Optional: play sound or remove

                // No delayed flip for player cards, they are created face up
                // if (isPlayer) {
                //     setTimeout(() => {
                //         this.flipCard(cardEl, card);
                //     }, 800 + (index * 200));
                // }

                if (isPlayer) {
                    cardEl.addEventListener('click', () => {
                        if (game.currentPlayerIndex === 0 && !this.drawCallback) {
                            // Toggle selection
                            const currentIdx = game.players[0].hand.findIndex(c => c.id === card.id);
                            const selectedIdx = this.selectedCardIndices.indexOf(currentIdx);
                            if (selectedIdx > -1) {
                                this.selectedCardIndices.splice(selectedIdx, 1);
                            } else {
                                this.selectedCardIndices.push(currentIdx);
                            }
                            this.renderGame(game);
                        }
                    });
                }
            }
            container.appendChild(cardEl); // Moves if exists, appends if new
        });

        // Remove extra
        Object.values(existingEls).forEach(el => el.remove());
    }

    createCardEl(card, faceDown = false) {
        const el = document.createElement('div');
        el.className = `card ${faceDown ? 'card-back' : ''}`;
        el.dataset.id = card.id; // Store ID

        if (faceDown) {
            el.innerHTML = '<img src="https://deckofcardsapi.com/static/img/back.png" class="card-image" alt="Back">';
            // Removed transparent background to ensure visibility fallback
        } else {
            this.setCardContent(el, card);
        }
        return el;
    }

    flipCard(el, card) {
        el.classList.remove('card-back');
        this.setCardContent(el, card);
        // Optional: Add a flip animation class here if desired
    }

    setCardContent(el, card) {
        el.dataset.suit = card.suit;
        el.dataset.rank = card.rank;
        el.innerHTML = ''; // Clear previous content

        const img = document.createElement('img');
        img.className = 'card-image';

        let r = card.rank;
        if (r === '10') r = '0';

        let s = '';
        if (card.suit === 'hearts') s = 'H';
        else if (card.suit === 'diamonds') s = 'D';
        else if (card.suit === 'clubs') s = 'C';
        else if (card.suit === 'spades') s = 'S';

        if (card.suit === 'joker') {
            // Try using X1.png for Joker, or fallback to styled text
            img.src = 'https://deckofcardsapi.com/static/img/X1.png';
            img.alt = 'Joker';
            img.onerror = () => {
                el.innerHTML = '<div class="center" style="color: black; font-size: 20px;">🤡<br>JOKER</div>';
                el.style.background = 'white';
            };
            el.appendChild(img);
            return;
        }

        img.src = `https://deckofcardsapi.com/static/img/${r}${s}.png`;
        img.alt = `${card.rank} of ${card.suit}`;
        el.appendChild(img);
        // Removed transparent background
    }

    enableDrawActions(callback) {
        this.drawCallback = callback;
        // Visual cue for drawing is handled by deck/discard clickability
        this.log('Draw a card...');
    }

    disableDrawActions() {
        this.drawCallback = null;
    }

    log(msg) {
        const toast = document.getElementById('toast-msg');
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => {
                if (toast.textContent === msg) toast.classList.remove('show');
            }, 3000);
        }
    }

    showRoundResult(result, pScore, cScore, players, onNext) {
        this.sound.playShow();
        // 1. Flip Computer Cards
        const compHandContainer = document.getElementById('computer-hand');
        this.renderHand(players[1], false, compHandContainer, null, true);

        // 2. Show Result Overlay
        // We use a full screen overlay now for better aesthetics
        let resultEl = document.getElementById('round-result');
        if (!resultEl) {
            resultEl = document.createElement('div');
            resultEl.id = 'round-result';
            resultEl.className = 'round-result';
            document.getElementById('game-board').appendChild(resultEl);
        }
        resultEl.classList.remove('hidden');

        resultEl.innerHTML = `
            <div class="result-box">
                <h3>${result}</h3>
                <div class="scores-display">
                    <div class="score-item">
                        <span class="label">Your Hand</span>
                        <span class="value">${pScore}</span>
                    </div>
                    <div class="score-item">
                        <span class="label">Comp Hand</span>
                        <span class="value">${cScore}</span>
                    </div>
                </div>
                <button id="next-round-btn" class="btn primary">Next Round</button>
            </div>
        `;

        document.getElementById('next-round-btn').addEventListener('click', () => {
            resultEl.classList.add('hidden');
            // Hide deck/discard again if we hid them? No, we didn't hide them in this version.
            onNext();
        });
    }

    showInGameMenu(game) {
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="overlay-content">
                <h2 style="margin-bottom: 20px;">Menu</h2>
                <div class="menu-btn-list">
                    <button id="menu-restart-btn" class="btn primary">Restart Game</button>
                    <button id="menu-rules-btn" class="btn secondary">How to Play</button>
                    <button id="menu-sound-btn" class="btn secondary">Sound: ${this.sound.enabled ? 'ON' : 'OFF'}</button>
                    <button id="menu-close-btn" class="btn" style="margin-top: 10px;">Close</button>
                </div>
            </div>
        `;

        document.getElementById('menu-restart-btn').addEventListener('click', () => {
            overlay.classList.add('hidden');
            game.startNewGame();
        });

        document.getElementById('menu-rules-btn').addEventListener('click', () => {
            overlay.innerHTML = `
                <div class="overlay-content">
                    <h2>How to Play</h2>
                    <ul>
                        <li>Goal: Keep your points low!</li>
                        <li>J, Q, K = 10 pts, A = 1 pt.</li>
                        <li>Turn: Discard 1 card, then Draw 1 card.</li>
                        <li>"Show" if you think you have lower points than computer.</li>
                        <li>Lowest points wins the round (0 pts). Loser gets hand value.</li>
                        <li>Wrong Show penalty: +30 pts.</li>
                        <li>Game ends when someone hits 100 pts.</li>
                    </ul>
                    <button id="rules-back-btn" class="btn primary">Back</button>
                </div>
            `;
            document.getElementById('rules-back-btn').addEventListener('click', () => {
                this.showInGameMenu(game);
            });
        });

        const soundBtn = document.getElementById('menu-sound-btn');
        soundBtn.addEventListener('click', () => {
            const isEnabled = this.sound.toggle();
            soundBtn.textContent = `Sound: ${isEnabled ? 'ON' : 'OFF'}`;
        });

        document.getElementById('menu-close-btn').addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
    }

    showGameOver(msg, onRestart) {
        const overlay = document.getElementById('overlay');
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="overlay-content">
                <h1>${msg}</h1>
                <div class="menu-btn-list">
                    <button id="restart-btn" class="btn primary">Play Again</button>
                </div>
            </div>
        `;
        document.getElementById('restart-btn').addEventListener('click', () => {
            overlay.classList.add('hidden');
            onRestart();
        });
    }
}
