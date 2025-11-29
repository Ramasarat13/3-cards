export class Player {
    constructor(name, isComputer = false) {
        this.name = name;
        this.isComputer = isComputer;
        this.hand = [];
        this.score = 0;
    }

    addCard(card) {
        this.hand.push(card);
    }

    removeCard(index) {
        return this.hand.splice(index, 1)[0];
    }

    calculateHandValue() {
        return this.hand.reduce((sum, card) => sum + card.value, 0);
    }

    // Simple AI Logic
    decideAction(topDiscardCard) {
        const handValue = this.calculateHandValue();

        // If hand value is very low, show cards
        if (handValue <= 5) {
            return { action: 'show' };
        }

        // Decide whether to pick from discard or draw
        // Simple logic: if discard card is lower than highest card in hand, take it (if it helps)
        // For now, let's just draw to keep it simple, or implement better logic later

        return { action: 'draw' };
    }

    decideDiscard() {
        // Discard the highest value card
        let maxVal = -1;
        let discardIndex = 0;

        this.hand.forEach((card, index) => {
            if (card.value > maxVal) {
                maxVal = card.value;
                discardIndex = index;
            }
        });

        return discardIndex;
    }
}
