/**
 * Valida el nombre del jugador
 */
export const validatePlayerName = (name) => {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'El nombre es requerido',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'El nombre debe tener al menos 2 caracteres',
    };
  }

  if (trimmed.length > 20) {
    return {
      valid: false,
      error: 'El nombre debe tener máximo 20 caracteres',
    };
  }

  // Solo letras, números y espacios
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'El nombre solo puede contener letras y números',
    };
  }

  return {
    valid: true,
    name: trimmed,
  };
};

/**
 * Valida el código de sala
 */
export const validateRoomCode = (code) => {
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      error: 'El código de sala es requerido',
    };
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length !== 6) {
    return {
      valid: false,
      error: 'El código debe tener 6 caracteres',
    };
  }

  // Solo letras y números
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'El código solo puede contener letras y números',
    };
  }

  return {
    valid: true,
    code: trimmed,
  };
};

/**
 * Valida una respuesta de categoría
 */
export const validateAnswer = (answer, letter) => {
  if (!answer || typeof answer !== 'string') {
    return {
      valid: false,
      error: 'Respuesta vacía',
    };
  }

  const trimmed = answer.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Respuesta vacía',
    };
  }

  if (trimmed.length > 50) {
    return {
      valid: false,
      error: 'Respuesta muy larga (máx. 50 caracteres)',
    };
  }

  // Verificar que empiece con la letra
  if (letter) {
    const normalized = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized.startsWith(letter.toLowerCase())) {
      return {
        valid: false,
        error: `Debe empezar con "${letter}"`,
      };
    }
  }

  return {
    valid: true,
    answer: trimmed,
  };
};

/**
 * Valida todas las respuestas
 */
export const validateAllAnswers = (answers, letter) => {
  const errors = {};
  let hasErrors = false;

  Object.entries(answers).forEach(([category, answer]) => {
    const validation = validateAnswer(answer, letter);
    if (!validation.valid) {
      errors[category] = validation.error;
      hasErrors = true;
    }
  });

  return {
    valid: !hasErrors,
    errors,
  };
};