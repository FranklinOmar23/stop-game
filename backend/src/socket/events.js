// Client -> Server events
export const CLIENT_EVENTS = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  START_GAME: 'start_game',
  SELECT_LETTER: 'select_letter',
  STOP_PRESSED: 'stop_pressed',
  SUBMIT_ANSWERS: 'submit_answers',
  CHALLENGE_ANSWER: 'challenge_answer',
  APPROVE_ANSWER: 'approve_answer',
  REJECT_ANSWER: 'reject_answer',
  NEXT_ROUND: 'next_round',
  RESTART_GAME: 'restart_game'
};

// Server -> Client events
export const SERVER_EVENTS = {
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_UPDATED: 'room_updated',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  LETTER_SELECTED: 'letter_selected',
  COUNTDOWN_STARTED: 'countdown_started',
  COUNTDOWN_TICK: 'countdown_tick',
  INPUTS_LOCKED: 'inputs_locked',
  PLAYER_SUBMITTED: 'player_submitted',
  START_DISCUSSION: 'start_discussion',
  ANSWER_CHALLENGED: 'answer_challenged',
  ANSWER_APPROVED: 'answer_approved',
  ANSWER_REJECTED: 'answer_rejected',
  ROUND_RESULTS: 'round_results',
  NEW_ROUND: 'new_round',
  GAME_FINISHED: 'game_finished',
  ERROR: 'error'
};