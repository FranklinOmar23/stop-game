import { GameProvider, useGameContext } from './context/GameContext';
import { GAME_STATES } from './utils/constants';
import Layout from './components/Layout/Layout';
import Toast from './components/shared/Toast';
import Loader from './components/shared/Loader';

// Lobby
import Home from './components/Lobby/Home';
import WaitingRoom from './components/Lobby/WaitingRoom';

// Game
import LetterSelector from './components/Game/LetterSelector';
import GameBoard from './components/Game/GameBoard';

// Results
import DiscussionPhase from './components/Results/DiscussionPhase';
import RoundResults from './components/Results/RoundResults';
import FinalResults from './components/Results/FinalResults';
import ReconnectingOverlay from './components/shared/ReconnectingOverlay';

import './styles/index.css';

const AppContent = () => {
  const { state } = useGameContext();

  // Mostrar overlay de reconexión
  if (state.isReconnecting || !state.connected) {
    return <ReconnectingOverlay isReconnecting={state.isReconnecting} isConnected={state.connected} />;
  }

  // Renderizar según el estado del juego
  const renderContent = () => {
    // Sin sala - mostrar home
    if (!state.roomCode) {
      return <Home />;
    }

    // En sala - renderizar según gameState
    switch (state.gameState) {
      case GAME_STATES.LOBBY:
        return <WaitingRoom />;

      case GAME_STATES.SELECTING_LETTER:
        return <LetterSelector />;

      case GAME_STATES.PLAYING:
      case GAME_STATES.COUNTDOWN:
        return <GameBoard />;

      case GAME_STATES.DISCUSSION:
        return <DiscussionPhase />;

      case GAME_STATES.ROUND_RESULTS:
        return <RoundResults />;

      case GAME_STATES.FINISHED:
        return <FinalResults />;

      default:
        return <WaitingRoom />;
    }
  };

  return <Layout>{renderContent()}</Layout>;
};

function App() {
  return (
    <GameProvider>
      <Toast />
      <AppContent />
    </GameProvider>
  );
}

export default App;