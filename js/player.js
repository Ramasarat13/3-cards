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

    // Advanced AI Logic with Probabilities
    decideAction(topDiscardCard, canShow) {
        const handValue = this.calculateHandValue();

        if (!canShow) return { action: 'play' };

        let showProbability = 0;

        // Base Probability based on Hand Value & Game Score
        if (handValue <= 6) {
            showProbability = 0.95; // Excellent hand, almost always show
        } else if (handValue <= 9) {
            showProbability = 0.75; // Good hand
        } else if (handValue <= 12) {
            showProbability = 0.50; // Decent hand, coin flip
        } else if (handValue <= 14 && this.score > 70) {
            showProbability = 0.35; // Risky, but behind in score
        } else if (handValue <= 16 && this.score > 85) {
            showProbability = 0.25; // Desperate
        }

        // Adjust based on Opponent's Discard
        if (topDiscardCard) {
            if (topDiscardCard.value <= 4) {
                // Opponent discarded low card -> they might be strong -> be cautious
                showProbability -= 0.15;
            } else if (topDiscardCard.value >= 10) {
                // Opponent discarded high card -> they might be weak -> be aggressive
                showProbability += 0.15;
            }
        }

        // Cap probability
        showProbability = Math.max(0, Math.min(1, showProbability));

        // Roll the dice
        if (Math.random() < showProbability) {
            return { action: 'show' };
        }

        return { action: 'play' };
    }

    decideDiscard() {
        // Group cards by rank
        const groups = {};
        this.hand.forEach((card, index) => {
            if (!groups[card.rank]) groups[card.rank] = [];
            groups[card.rank].push({ card, index });
        });

        // Find the group with the highest total value
        let bestDiscardIndices = [];
        let maxRemovedValue = -1;

        Object.values(groups).forEach(group => {
            const groupValue = group.reduce((sum, item) => sum + item.card.value, 0);
            if (groupValue > maxRemovedValue) {
                maxRemovedValue = groupValue;
                bestDiscardIndices = group.map(item => item.index);
            }
        });

        return bestDiscardIndices;
    }
}
