import { createContext, useContext, useReducer, useEffect } from 'react';
import { socketService } from '../services/socket';
import toast from 'react-hot-toast';

const GameContext = createContext(null);

const initialState = {
    // Socket
    connected: false,

    // Player
    player: null,

    // Room
    room: null,
    roomCode: null,
    players: [],
    host: null,

    // Game State
    gameState: 'lobby', // lobby, selecting_letter, playing, countdown, discussion, round_results, finished
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
    switch (action.type) {
        case 'SET_CONNECTED':
            return { ...state, connected: action.payload };

        case 'SET_PLAYER':
            return { ...state, player: action.payload };

        case 'SET_ROOM':
            return {
                ...state,
                room: action.payload,
                roomCode: action.payload?.code || state.roomCode,
                players: action.payload?.players || [],
                host: action.payload?.host || null,
                gameState: action.payload?.gameState || state.gameState,
                currentRound: action.payload?.currentRound || state.currentRound,
                currentLetter: action.payload?.currentLetter || state.currentLetter,
                currentTurnPlayer: action.payload?.currentTurnPlayer || state.currentTurnPlayer,
            };

        case 'UPDATE_ROOM':
            return {
                ...state,
                ...action.payload,
            };

        case 'SET_GAME_STATE':
            return { ...state, gameState: action.payload };

        case 'SET_LETTER':
            return { ...state, currentLetter: action.payload };

        case 'SET_MY_ANSWERS':
            return { ...state, myAnswers: action.payload };

        case 'UPDATE_MY_ANSWER':
            return {
                ...state,
                myAnswers: {
                    ...state.myAnswers,
                    [action.payload.category]: action.payload.value,
                },
            };

        case 'SET_ALL_ANSWERS':
            return { ...state, allAnswers: action.payload };

        case 'SET_COUNTDOWN':
            return {
                ...state,
                countdownActive: action.payload.active,
                countdownSeconds: action.payload.seconds,
            };

        // Dentro del reducer, agregar este caso:

        case 'UPDATE_MY_ANSWER':
            return {
                ...state,
                myAnswers: {
                    ...state.myAnswers,
                    [action.payload.category]: action.payload.value,
                },
            };

        case 'COUNTDOWN_TICK':
            return {
                ...state,
                countdownSeconds: action.payload,
            };

        case 'SET_ROUND_RESULTS':
            return { ...state, roundResults: action.payload };

        case 'SET_FINAL_SCORES':
            return { ...state, finalScores: action.payload };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'RESET_GAME':
            return {
                ...initialState,
                connected: state.connected,
                player: state.player,
                roomCode: state.roomCode,
            };

        case 'LEAVE_ROOM':
            return {
                ...initialState,
                connected: state.connected,
            };

        default:
            return state;
    }
};

export const GameProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        const socket = socketService.connect();

        socket.on('connect', () => {
            console.log('✅ Connected to server');
            dispatch({ type: 'SET_CONNECTED', payload: true });
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            dispatch({ type: 'SET_CONNECTED', payload: false });
            toast.error('Desconectado del servidor');
        });

        socket.on('error', (data) => {
            console.error('❌ Error:', data);
            toast.error(data.message || 'Error del servidor');
            dispatch({ type: 'SET_ERROR', payload: data.message });
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
            toast.success(`${data.player.name} se unió a la sala`);
        });

        socket.on('player_left', (data) => {
            console.log('Player left:', data);
            toast(`${data.playerName} salió de la sala`, { icon: '👋' });
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
            toast.success(`Letra seleccionada: ${data.letter}`, { icon: '🔤' });
        });

        socket.on('countdown_started', (data) => {
            console.log('Countdown started:', data);
            dispatch({
                type: 'SET_COUNTDOWN',
                payload: { active: true, seconds: data.seconds },
            });
            toast('¡STOP! Cuenta regresiva iniciada', { icon: '⏱️' });
        });

        socket.on('countdown_tick', (data) => {
            dispatch({ type: 'COUNTDOWN_TICK', payload: data.seconds });
        });

        socket.on('inputs_locked', (data) => {
            console.log('Inputs locked:', data);
            dispatch({ type: 'SET_GAME_STATE', payload: 'discussion' });
            toast.error('¡Tiempo agotado! Tableros bloqueados');
        });

        socket.on('player_submitted', (data) => {
            console.log('Player submitted:', data);
            toast(`${data.playerName} envió sus respuestas`, { icon: '✅' });
        });

        socket.on('start_discussion', (data) => {
            console.log('Start discussion:', data);
            dispatch({ type: 'SET_ALL_ANSWERS', payload: data.answers });
            dispatch({ type: 'SET_GAME_STATE', payload: 'discussion' });
            toast.success('¡Fase de discusión!');
        });

        socket.on('answer_challenged', (data) => {
            console.log('Answer challenged:', data);
            toast(`${data.challengedBy} desafió la respuesta de ${data.challengedPlayer}`, {
                icon: '⚠️',
            });
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
            toast.success('¡Resultados de la ronda!');
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