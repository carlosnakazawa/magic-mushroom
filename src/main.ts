import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './style.css';
import './style-menus.css';
import './style-mobile.css';
import { Game } from './game/Game';

const app = document.getElementById('app')!;

// Espera a fonte carregar para a placa 3D (desenhada em canvas) usar a Fredoka.
void document.fonts.load('700 40px Fredoka').finally(() => {
  app.querySelector('.loading')?.remove();
  const game = new Game(app);
  // Acesso pelo console para depuração: window.game
  (window as unknown as { game: Game }).game = game;
});
