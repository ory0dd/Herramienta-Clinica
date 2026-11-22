// Instrucciones fijas del cuaderno de cada caso.

/** Instrucción para resumir una sesión recién transcrita. */
export const RESUMIR_SESION = 'Resume esta sesión en 4 a 6 líneas: tema central, lo que la persona trajo, momentos significativos, acuerdos o tareas, y cualquier indicador de riesgo. Usa solo lo que está en la transcripción.';

/** Instrucción para redactar la nota de evolución de una sesión. */
export const NOTA_DE_SESION = (formato) => `Redacta la nota de evolución de esta sesión en formato ${formato}, usando solo lo que está en la transcripción y en el contexto del caso.`;
