export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        let idCounter = 0;
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.cards.push({ id: `card-${idCounter++}`, suit, rank, value: this.getCardValue(rank) });
            }
        }
        // Add 2 Jokers
        this.cards.push({ id: `card-${idCounter++}`, suit: 'joker', rank: 'Joker', value: 0 });
        this.cards.push({ id: `card-${idCounter++}`, suit: 'joker', rank: 'Joker', value: 0 });

        this.shuffle();
    }

    getCardValue(rank) {
        if (rank === 'A') return 1;
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        return parseInt(rank);
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }
}
