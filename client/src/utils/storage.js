const STORAGE_KEY = 'stop_game_state';

export const storage = {
  save: (state) => {
    try {
      const toSave = {
        roomCode: state.roomCode,
        player: state.player,
        gameState: state.gameState,
        currentRound: state.currentRound,
        currentLetter: state.currentLetter,
        myAnswers: state.myAnswers,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log('💾 Estado guardado:', toSave); // ← Debug
    } catch (error) {
      console.error('Error saving state:', error);
    }
  },

  load: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        console.log('📭 No hay estado guardado'); // ← Debug
        return null;
      }

      const parsed = JSON.parse(saved);
      console.log('📦 Estado cargado:', parsed); // ← Debug
      
      // Verificar que no sea muy antiguo (30 minutos)
      const THIRTY_MINUTES = 30 * 60 * 1000;
      if (Date.now() - parsed.timestamp > THIRTY_MINUTES) {
        console.log('⏰ Estado expirado, limpiando');
        storage.clear();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error loading state:', error);
      return null;
    }
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Estado limpiado');
  },

  shouldReconnect: () => {
    const saved = storage.load();
    const should = saved && saved.roomCode && saved.player;
    console.log('🤔 ¿Debe reconectar?', should, saved); // ← Debug
    return should;
  }
};