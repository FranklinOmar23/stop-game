import { useGameContext } from '../context/GameContext';
import { useSocket } from './useSocket';
import { CATEGORIES } from '../utils/constants';

export const useGame = () => {
    const { state, dispatch } = useGameContext();
    const { emit } = useSocket();

    const createRoom = (playerName) => {
        emit('create_room', { playerName });
    };

    const joinRoom = (roomCode, playerName) => {
        emit('join_room', { roomCode, playerName });
    };

    const leaveRoom = () => {
        if (state.roomCode) {
            emit('leave_room', { roomCode: state.roomCode });
            dispatch({ type: 'LEAVE_ROOM' });
        }
    };

    const startGame = () => {
        if (state.roomCode) {
            emit('start_game', { roomCode: state.roomCode });
        }
    };

    const selectLetter = (letter) => {
        if (state.roomCode) {
            emit('select_letter', { roomCode: state.roomCode, letter });
        }
    };

    const pressStop = () => {
        if (state.roomCode) {
            emit('stop_pressed', { roomCode: state.roomCode });
        }
    };

    const submitAnswers = () => {
        if (state.roomCode) {
            // Asegurar que todas las categorías estén presentes
            const answers = {};
            CATEGORIES.forEach((category) => {
                answers[category] = state.myAnswers[category] || '';
            });

            emit('submit_answers', { roomCode: state.roomCode, answers });
        }
    };

    const updateAnswer = (category, value) => {
        // Actualizar localmente
        dispatch({
            type: 'UPDATE_MY_ANSWER',
            payload: { category, value },
        });

        // *** Enviar al servidor en tiempo real ***
        if (state.roomCode) {
            emit('update_current_answer', {
                roomCode: state.roomCode,
                category,
                value
            });
        }
    };

    const challengeAnswer = (challengedPlayerId, category) => {
        if (state.roomCode) {
            emit('challenge_answer', {
                roomCode: state.roomCode,
                category,
                challengedPlayerId,
            });
        }
    };

    const approveAnswer = (playerId, category) => {
        if (state.roomCode) {
            emit('approve_answer', {
                roomCode: state.roomCode,
                playerId,
                category,
            });
        }
    };

    const rejectAnswer = (playerId, category) => {
        if (state.roomCode) {
            emit('reject_answer', {
                roomCode: state.roomCode,
                playerId,
                category,
            });
        }
    };

    const calculateResults = () => {
        if (state.roomCode) {
            emit('calculate_results', { roomCode: state.roomCode });
        }
    };

    const nextRound = () => {
        if (state.roomCode) {
            emit('next_round', { roomCode: state.roomCode });
        }
    };

    const restartGame = () => {
        if (state.roomCode) {
            emit('restart_game', { roomCode: state.roomCode });
        }
    };

    const isHost = () => {
        return state.player?.id === state.host;
    };

    const isMyTurn = () => {
        return state.player?.id === state.currentTurnPlayer;
    };

    const canSubmit = () => {
        // Verificar que al menos tenga algunas respuestas
        return Object.values(state.myAnswers).some((answer) => answer.trim() !== '');
    };

    const getPlayerById = (playerId) => {
        return state.players.find((p) => p.id === playerId);
    };

    return {
        ...state,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        selectLetter,
        pressStop,
        submitAnswers,
        updateAnswer,
        challengeAnswer,
        approveAnswer,
        rejectAnswer,
        calculateResults,
        nextRound,
        restartGame,
        isHost,
        isMyTurn,
        canSubmit,
        getPlayerById,
    };
};