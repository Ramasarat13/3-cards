// Main entry point
import { Game } from './game.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const game = new Game(ui);
    game.init();
});
