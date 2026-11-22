// Directrices y acciones rápidas del Asistente. Cada terapeuta puede ajustarlas aquí o desde "Directrices".

export const MARCOS = {
  integrativo: 'Integrativo',
  tcc: 'Cognitivo-conductual',
  contextual: 'Terapias contextuales (ACT, DBT)',
  psicodinamico: 'Psicodinámico',
  sistemico: 'Sistémico y familiar',
  humanista: 'Humanista y Gestalt',
  fenomenologico: 'Fenomenológico-existencial',
};

export const FORMATOS_NOTA = {
  SOAP: {
    nombre: 'SOAP',
    instruccion: 'S (Subjetivo): relato y estado emocional reportado. O (Objetivo): conducta observable, afecto y lenguaje no verbal. A (Análisis): formulación funcional, avance y factores mantenedores. P (Plan): intervenciones, tareas acordadas y encuadre de la próxima sesión.',
  },
  TCC: {
    nombre: 'Cognitivo-conductual',
    instruccion: 'Situaciones detonantes, pensamientos automáticos y distorsiones, respuestas fisiológicas y conductuales, creencias nucleares activadas y tareas o experimentos para la semana.',
  },
  FENOMENOLOGICO: {
    nombre: 'Fenomenológico',
    instruccion: 'Temporalidad vivida, resonancia corporal y afectiva, temas existenciales emergentes y polaridades presentes en el discurso.',
  },
  BREVE: {
    nombre: 'Nota breve',
    instruccion: 'Máximo 150 palabras: foco de la sesión, avance o resistencia, acuerdos y valoración breve de riesgo.',
  },
};

export const AJUSTES_INICIALES = {
  marco: 'integrativo',
  formato: 'SOAP',
  instrucciones: '',
  desidentificar: true,
  clave: '',
};

/** Acciones rápidas. `texto` se pone en la caja de mensaje para que la terapeuta lo complete o lo mande. */
export const ACCIONES = [
  { id: 'nota', titulo: 'Nota de evolución', texto: (a) => `Redacta una nota de evolución en formato ${FORMATOS_NOTA[a.formato]?.nombre || 'SOAP'} a partir de estos apuntes de la sesión:\n\n` },
  { id: 'entrevista', titulo: 'Resumir la entrevista', texto: () => 'Resume la entrevista inicial en: motivo de consulta, historia del problema, factores de riesgo, factores de protección y preguntas clave para la primera sesión.' },
  { id: 'hipotesis', titulo: 'Hipótesis de trabajo', texto: () => 'Propón tres hipótesis de trabajo para este caso, con los datos que sostienen cada una y lo que falta explorar para confirmarlas o descartarlas.' },
  { id: 'plan', titulo: 'Plan de la próxima sesión', texto: () => 'Sugiere un plan para la próxima sesión: objetivo, dos o tres intervenciones posibles según mi marco y una tarea opcional entre sesiones.' },
  { id: 'metafora', titulo: 'Metáfora terapéutica', texto: () => 'Propón dos metáforas terapéuticas adecuadas al momento del caso, explicadas en lenguaje sencillo para usarlas en sesión.' },
];

/** Instrucciones de base del asistente (lo que no cambia). */
export function armarSistema(ajustes, fuentes) {
  const formato = FORMATOS_NOTA[ajustes.formato] || FORMATOS_NOTA.SOAP;
  return [
    'Eres un asistente clínico para psicoterapeutas en México. Respondes en español, con lenguaje técnico, claro y breve.',
    'Trabajas solo con la información de las fuentes del caso. Si falta información, dilo; no inventes datos.',
    'Distingue entre lo observado o reportado y tus hipótesis. No das diagnósticos definitivos: propones hipótesis para que la terapeuta las valore.',
    'Si notas indicadores de riesgo (autolesión, suicidio, violencia), señálalo al inicio de tu respuesta.',
    `Marco teórico de la terapeuta: ${MARCOS[ajustes.marco] || MARCOS.integrativo}.`,
    `Cuando redactes notas de evolución, usa este formato: ${formato.instruccion}`,
    ajustes.instrucciones?.trim() ? `Indicaciones de la terapeuta: ${ajustes.instrucciones.trim()}` : '',
    '',
    'FUENTES DEL CASO:',
    fuentes || 'No se seleccionaron fuentes para este caso.',
  ].filter((x) => x !== '').join('\n');
}
