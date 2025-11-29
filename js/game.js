import { Deck } from './deck.js';
import { Player } from './player.js';

export class Game {
    constructor(ui) {
        this.ui = ui;
        this.deck = new Deck();
        this.players = [
            new Player('You'),
            new Player('Computer', true)
        ];
        this.currentPlayerIndex = 0;
        this.round = 1;
        this.discardPile = [];
        this.gameActive = false;
        this.turnsPlayed = 0;
    }

    init() {
        this.ui.showMainMenu(this.startNewGame.bind(this));
    }

    startNewGame() {
        this.players.forEach(p => p.score = 0);
        this.round = 1;
        this.startRound();
    }

    startRound() {
        this.deck.reset();
        this.discardPile = [];
        this.players.forEach(p => p.hand = []);

        // Deal 3 cards to each player
        for (let i = 0; i < 3; i++) {
            this.players.forEach(p => p.addCard(this.deck.draw()));
        }

        // Place one card on discard pile to start
        this.discardPile.push(this.deck.draw());

        // Rotating starting player: Round 1 -> Player (0), Round 2 -> Computer (1), etc.
        this.currentPlayerIndex = (this.round - 1) % 2;

        this.gameActive = true;
        this.turnsPlayed = 0;

        this.updateUI();

        // If it's computer's turn, play
        if (this.players[this.currentPlayerIndex].isComputer) {
            setTimeout(() => this.playComputerTurn(), 1000);
        }
    }

    updateUI() {
        this.ui.renderGame(this);
    }

    async playComputerTurn() {
        if (!this.gameActive) return;

        const computer = this.players[1];
        const topDiscard = this.discardPile[this.discardPile.length - 1];

        // 1. Decide action (Draw or Show)
        // For now, computer always plays unless very low score
        // Rule: Can't show on first turn (turnsPlayed < 2 means p1 and p2 haven't played yet? 
        // Actually turnsPlayed counts individual turns. 0=P1 start, 1=C1 start.
        // So if turnsPlayed < 2, no one can show? Or just individual?
        // Usually "1st turn" means the first round of turns.
        // Let's say turnsPlayed must be >= 2 (P1 and C1 have played at least once? No, that's round 2).
        // If I am computer, and it is my first turn, I cannot show.
        // My first turn is when turnsPlayed == 1 (since P1 is 0).

        const canShow = this.turnsPlayed >= 2; // Let's ensure at least one full round (P1, C1) passed? 
        // Or just "my first turn".
        // If "Cards can't be shown on the 1st turn", it usually means Round 1.

        const decision = computer.decideAction(topDiscard, canShow);

        if (decision.action === 'show') {
            this.endRound(computer);
            return;
        }

        // 2. Discard
        // Computer discards before drawing in this game rules? 
        // "On a players turn, they have to first discard a card... then he show draw a card"
        // YES. Discard first.

        const discardIndex = computer.decideDiscard();
        const discardedCard = computer.removeCard(discardIndex);
        this.discardPile.push(discardedCard);
        this.ui.sound.playCardFlip();
        this.ui.log(`Computer discarded ${discardedCard.rank}`);
        this.updateUI();

        await new Promise(r => setTimeout(r, 1000)); // Delay for effect

        // 3. Draw
        // Simple AI: Always draw from deck for now to hide info
        const newCard = this.deck.draw();
        computer.addCard(newCard);
        this.ui.log('Computer drew a card');

        this.endTurn();
    }

    playerDiscard(cardIndices) {
        if (this.players[this.currentPlayerIndex].isComputer) return;

        const player = this.players[0];

        // Sort indices descending to remove correctly
        cardIndices.sort((a, b) => b - a);

        const discardedCards = [];
        cardIndices.forEach(index => {
            discardedCards.push(player.removeCard(index));
        });

        // Add all to discard pile (in order)
        discardedCards.reverse().forEach(card => this.discardPile.push(card));

        this.ui.sound.playCardFlip(); // Sound on discard

        this.updateUI();

        // Auto-draw from deck as requested
        setTimeout(() => {
            this.playerDraw(false);
        }, 500); // Small delay for visual clarity
    }

    playerDraw(fromDiscard = false) {
        const player = this.players[0];
        let card;
        if (fromDiscard) {
            card = this.discardPile.pop();
        } else {
            card = this.deck.draw();
        }
        player.addCard(card);
        this.endTurn();
    }

    playerShow() {
        if (this.players[this.currentPlayerIndex].isComputer) return;
        this.endRound(this.players[0]);
    }

    endTurn() {
        this.updateUI();
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 2;
        this.turnsPlayed++;

        if (this.players[this.currentPlayerIndex].isComputer) {
            setTimeout(() => this.playComputerTurn(), 2000);
        }
    }

    endRound(shower) {
        this.gameActive = false;
        const player = this.players[0];
        const computer = this.players[1];

        const pScore = player.calculateHandValue();
        const cScore = computer.calculateHandValue();

        let result = '';

        if (shower === player) {
            if (pScore < cScore) {
                // Player wins round, 0 pts. Computer gets cScore.
                computer.score += cScore;
                result = 'You Won the Round!';
            } else {
                // Player loses (or tie), gets 30 pts. Computer gets 0.
                player.score += 30; // Penalty
                result = 'You Lost the Round! (Wrong Show)';
            }
        } else {
            // Computer showed
            if (cScore < pScore) {
                player.score += pScore;
                result = 'Computer Won the Round!';
            } else {
                computer.score += 30;
                result = 'Computer Lost the Round! (Wrong Show)';
            }
        }

        this.ui.showRoundResult(result, pScore, cScore, this.players, () => {
            if (player.score >= 100 || computer.score >= 100) {
                this.endGame();
            } else {
                this.round++;
                this.startRound();
            }
        });
    }

    endGame() {
        const player = this.players[0];
        const computer = this.players[1];
        let msg = '';
        if (player.score >= 100 && computer.score >= 100) {
            msg = player.score < computer.score ? 'You Won!' : 'Game Over! You Lost!';
        } else if (player.score >= 100) {
            msg = 'Game Over! You Lost!';
        } else {
            msg = 'You Won!';
        }
        this.ui.showGameOver(msg, this.startNewGame.bind(this));
    }
}
