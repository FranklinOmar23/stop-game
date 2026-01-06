import { createContext, useContext, useReducer, useEffect } from 'react';
import { socketService } from '../services/socket';
import { storage } from '../utils/storage';
import toast from 'react-hot-toast';

const GameContext = createContext(null);

const initialState = {
    // Socket
    connected: false,
    isReconnecting: false,

    // Player
    player: null,

    // Room
    room: null,
    roomCode: null,
    players: [],
    host: null,

    // Game State
    gameState: 'lobby',
    currentRound: 0,
    maxRounds: 5,
    currentLetter: null,
    currentTurnPlayer: null,

    // Answers
    myAnswers: {},
    allAnswers: {},

    // Countdown
    countdownActive: false,
    countdownSeconds: 0,

    // Results
    roundResults: null,
    finalScores: null,

    // UI
    isLoading: false,
    error: null,
};

const gameReducer = (state, action) => {
    let newState = state;

    switch (action.type) {
        case 'SET_CONNECTED':
            newState = { ...state, connected: action.payload };
            break;

        case 'SET_RECONNECTING':
            newState = { ...state, isReconnecting: action.payload };
            break;

        case 'SET_PLAYER':
            newState = { ...state, player: action.payload };
            break;

        case 'SET_ROOM':
            newState = {
                ...state,
                room: action.payload,
                roomCode: action.payload?.code || state.roomCode,
                players: action.payload?.players || [],
                host: action.payload?.host || null,
                gameState: action.payload?.gameState || state.gameState,
                currentRound: action.payload?.currentRound || state.currentRound,
                currentLetter: action.payload?.currentLetter || state.currentLetter,
                currentTurnPlayer: action.payload?.currentTurnPlayer || state.currentTurnPlayer,
                isReconnecting: false,
            };
            break;

        case 'UPDATE_ROOM':
            newState = {
                ...state,
                ...action.payload,
            };
            break;

        case 'SET_GAME_STATE':
            newState = { ...state, gameState: action.payload };
            break;

        case 'SET_LETTER':
            newState = { ...state, currentLetter: action.payload };
            break;

        case 'SET_MY_ANSWERS':
            newState = { ...state, myAnswers: action.payload };
            break;

        case 'UPDATE_MY_ANSWER':
            newState = {
                ...state,
                myAnswers: {
                    ...state.myAnswers,
                    [action.payload.category]: action.payload.value,
                },
            };
            break;

        case 'SET_ALL_ANSWERS':
            newState = { ...state, allAnswers: action.payload };
            break;

        case 'SET_COUNTDOWN':
            newState = {
                ...state,
                countdownActive: action.payload.active,
                countdownSeconds: action.payload.seconds,
            };
            break;

        case 'COUNTDOWN_TICK':
            newState = { ...state, countdownSeconds: action.payload };
            break;

        case 'SET_ROUND_RESULTS':
            newState = { ...state, roundResults: action.payload };
            break;

        case 'SET_FINAL_SCORES':
            newState = { ...state, finalScores: action.payload };
            break;

        case 'SET_LOADING':
            newState = { ...state, isLoading: action.payload };
            break;

        case 'SET_ERROR':
            newState = { ...state, error: action.payload };
            break;

        case 'RESET_GAME':
            newState = {
                ...initialState,
                connected: state.connected,
                player: state.player,
                roomCode: state.roomCode,
            };
            break;

        case 'LEAVE_ROOM':
            storage.clear();
            newState = {
                ...initialState,
                connected: state.connected,
            };
            break;

        default:
            return state;
    }

    // Guardar estado automáticamente (excepto casos temporales)
    if (
        action.type !== 'SET_CONNECTED' &&
        action.type !== 'COUNTDOWN_TICK' &&
        action.type !== 'SET_LOADING' &&
        action.type !== 'SET_RECONNECTING' &&
        action.type !== 'LEAVE_ROOM'
    ) {
        storage.save(newState);
    }

    return newState;
};

// Cargar estado inicial
const loadInitialState = () => {
    const saved = storage.load();
    if (saved && storage.shouldReconnect()) {
        console.log('🔄 Estado guardado encontrado, preparando reconexión');
        return {
            ...initialState,
            ...saved,
            isReconnecting: true,
            connected: false,
        };
    }
    return initialState;
};

export const GameProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState, loadInitialState);

    // Intentar reconexión automática con timeout
    // Intentar reconexión automática con timeout
    useEffect(() => {
        let failTimeout = null;

        if (state.isReconnecting && state.connected && state.roomCode && state.player) {
            console.log('🔄 Intentando reconectar a sala:', state.roomCode);

            const timer = setTimeout(() => {
                socketService.emit('rejoin_room', {
                    roomCode: state.roomCode,
                    playerId: state.player.id,
                    playerName: state.player.name,
                });

                // Timeout de seguridad: si no reconecta en 10 segundos, cancelar
                failTimeout = setTimeout(() => {
                    if (state.isReconnecting) {
                        console.log('⏰ Timeout de reconexión, limpiando estado');
                        toast.error('No se pudo reconectar a la partida');
                        dispatch({ type: 'LEAVE_ROOM' });
                    }
                }, 10000);

            }, 1000);

            return () => {
                clearTimeout(timer);
                if (failTimeout) {
                    clearTimeout(failTimeout);
                }
            };
        }

        // Limpiar el timeout si ya no está reconectando
        if (!state.isReconnecting && failTimeout) {
            clearTimeout(failTimeout);
        }

    }, [state.isReconnecting, state.connected, state.roomCode, state.player]);

    useEffect(() => {
        const socket = socketService.connect();

        // Connection events
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            dispatch({ type: 'SET_CONNECTED', payload: true });
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
            dispatch({ type: 'SET_CONNECTED', payload: false });

            if (reason === 'io server disconnect') {
                toast.error('Servidor desconectado');
                dispatch({ type: 'LEAVE_ROOM' });
            } else {
                toast.error('Conexión perdida. Reconectando...');
                dispatch({ type: 'SET_RECONNECTING', payload: true });
            }
        });

        socket.on('error', (data) => {
            console.error('❌ Error:', data);
            toast.error(data.message || 'Error del servidor');
            dispatch({ type: 'SET_ERROR', payload: data.message });
        });

        // Reconexión exitosa
        socket.on('reconnected', (data) => {
            console.log('✅ Reconectado exitosamente:', data);
            toast.success('¡Reconectado a la partida!');
            dispatch({ type: 'SET_RECONNECTING', payload: false });
            dispatch({ type: 'SET_ROOM', payload: data.room });
        });

        socket.on('room_not_found', () => {
            console.log('❌ Sala no encontrada');
            toast.error('La sala ya no existe');
            dispatch({ type: 'LEAVE_ROOM' });
        });

        // Room events
        socket.on('room_created', (data) => {
            console.log('Room created:', data);
            dispatch({ type: 'SET_PLAYER', payload: data.player });
            dispatch({ type: 'SET_ROOM', payload: data.room });
            toast.success(`Sala creada: ${data.roomCode}`);
        });

        socket.on('room_joined', (data) => {
            console.log('Room joined:', data);
            dispatch({ type: 'SET_PLAYER', payload: data.player });
            dispatch({ type: 'SET_ROOM', payload: data.room });
            toast.success(`Te uniste a la sala: ${data.roomCode}`);
        });

        socket.on('room_updated', (data) => {
            console.log('Room updated:', data);
            dispatch({ type: 'SET_ROOM', payload: data.room });
        });

        socket.on('player_joined', (data) => {
            console.log('Player joined:', data);
            toast.success(`${data.player.name} se unió`);
        });

        socket.on('player_left', (data) => {
            console.log('Player left:', data);
            toast(`${data.playerName} salió`, { icon: '👋' });
        });

        socket.on('player_reconnected', (data) => {
            console.log('Player reconnected:', data);
            toast.success(`${data.playerName} se reconectó`);
        });

        // Game events
        socket.on('game_started', (data) => {
            console.log('Game started:', data);
            dispatch({ type: 'SET_GAME_STATE', payload: 'selecting_letter' });
            toast.success('¡El juego ha comenzado!');
        });

        socket.on('letter_selected', (data) => {
            console.log('Letter selected:', data);
            dispatch({ type: 'SET_LETTER', payload: data.letter });
            dispatch({ type: 'SET_GAME_STATE', payload: 'playing' });
            toast.success(`Letra: ${data.letter}`, { icon: '🔤' });
        });

        socket.on('countdown_started', (data) => {
            console.log('Countdown started:', data);
            dispatch({ type: 'SET_COUNTDOWN', payload: { active: true, seconds: data.seconds } });
            toast('¡STOP! Cuenta regresiva', { icon: '⏱️' });
        });

        socket.on('countdown_tick', (data) => {
            dispatch({ type: 'COUNTDOWN_TICK', payload: data.seconds });
        });

        socket.on('inputs_locked', (data) => {
            console.log('Inputs locked:', data);
            dispatch({ type: 'SET_GAME_STATE', payload: 'discussion' });
            toast.error('¡Tiempo agotado!');
        });

        socket.on('player_submitted', (data) => {
            console.log('Player submitted:', data);
            toast(`${data.playerName} envió respuestas`, { icon: '✅' });
        });

        socket.on('start_discussion', (data) => {
            console.log('Start discussion:', data);
            dispatch({ type: 'SET_ALL_ANSWERS', payload: data.answers });
            dispatch({ type: 'SET_GAME_STATE', payload: 'discussion' });
            toast.success('Fase de discusión');
        });

        socket.on('answer_challenged', (data) => {
            console.log('Answer challenged:', data);
            toast(`${data.challengedBy} desafió respuesta`, { icon: '⚠️' });
        });

        socket.on('answer_approved', (data) => {
            console.log('Answer approved:', data);
            toast.success('Respuesta aprobada');
        });

        socket.on('answer_rejected', (data) => {
            console.log('Answer rejected:', data);
            toast.error(`Respuesta rechazada (-${data.deductedPoints} puntos)`);
        });

        socket.on('round_results', (data) => {
            console.log('Round results:', data);
            dispatch({ type: 'SET_ROUND_RESULTS', payload: data.results });
            dispatch({ type: 'SET_GAME_STATE', payload: 'round_results' });
            toast.success('Resultados de ronda');
        });

        socket.on('new_round', (data) => {
            console.log('New round:', data);
            dispatch({ type: 'UPDATE_ROOM', payload: { currentRound: data.round } });
            dispatch({ type: 'SET_GAME_STATE', payload: 'selecting_letter' });
            dispatch({ type: 'SET_MY_ANSWERS', payload: {} });
            dispatch({ type: 'SET_COUNTDOWN', payload: { active: false, seconds: 0 } });
            toast.success(`¡Ronda ${data.round}!`);
        });

        socket.on('game_finished', (data) => {
            console.log('Game finished:', data);
            dispatch({ type: 'SET_FINAL_SCORES', payload: data.finalScores });
            dispatch({ type: 'SET_GAME_STATE', payload: 'finished' });
            toast.success('¡Juego terminado!', { icon: '🏁' });
        });

        socket.on('game_restarted', () => {
            console.log('Game restarted');
            dispatch({ type: 'RESET_GAME' });
            toast.success('Juego reiniciado');
        });

        socket.on('game_cancelled', (data) => {
            console.log('Game cancelled:', data);
            toast.error(data.message);
            dispatch({ type: 'RESET_GAME' });
        });

        return () => {
            socketService.disconnect();
        };
    }, []);

    const value = {
        state,
        dispatch,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGameContext must be used within GameProvider');
    }
    return context;
};