// Entrevista clínica inicial. La llena el consultante desde su cuenta, por secciones.
// Cada terapeuta puede editar, quitar o agregar preguntas aquí. Los `id` no deben repetirse:
// las respuestas se guardan con ese id.
//
// Tipos: 'corto' (una línea), 'largo' (párrafo), 'opciones' (elegir una) y 'escala' (0 a 10).

export const SECCIONES_ENTREVISTA = [
  {
    id: 'sobre-ti',
    titulo: 'Sobre ti',
    descripcion: 'Datos generales para conocerte. Puedes usar un alias.',
    preguntas: [
      { id: 'nombre_preferido', tipo: 'corto', titulo: '¿Cómo te gusta que te digan?', placeholder: 'Tu nombre o un alias' },
      { id: 'edad', tipo: 'corto', titulo: '¿Cuántos años tienes?', placeholder: 'Ej. 29' },
      { id: 'ocupacion', tipo: 'corto', titulo: '¿A qué te dedicas?', placeholder: 'Trabajo, estudio u otra actividad' },
      { id: 'estado_civil', tipo: 'opciones', titulo: 'Situación de pareja', opciones: ['Soltera/o', 'En una relación', 'Casada/o o en unión libre', 'Separada/o o divorciada/o', 'Viuda/o', 'Prefiero no decir'] },
      { id: 'con_quien_vives', tipo: 'corto', titulo: '¿Con quién vives?', placeholder: 'Ej. con mi pareja y mi hija' },
      { id: 'escolaridad', tipo: 'opciones', titulo: 'Último grado de estudios', opciones: ['Primaria', 'Secundaria', 'Preparatoria o bachillerato', 'Licenciatura', 'Posgrado', 'Otro'] },
    ],
  },
  {
    id: 'motivo',
    titulo: 'Lo que te trae',
    descripcion: 'Cuéntalo con tus palabras. No hay respuestas correctas.',
    preguntas: [
      { id: 'motivo', tipo: 'largo', titulo: '¿Qué te trae a terapia?', placeholder: 'Ej. Me siento muy acelerado y me cuesta desconectar…' },
      { id: 'desde_cuando', tipo: 'corto', titulo: '¿Desde cuándo lo notas?', placeholder: 'Ej. desde hace tres meses' },
      { id: 'detonante', tipo: 'largo', titulo: '¿Pasó algo que haya coincidido con el inicio?', placeholder: 'Un cambio, una pérdida, una mudanza… o nada en particular' },
      { id: 'areas_afectadas', tipo: 'largo', titulo: '¿En qué partes de tu vida te está afectando?', placeholder: 'Trabajo, pareja, familia, sueño, ánimo, concentración…' },
      { id: 'intensidad', tipo: 'escala', titulo: 'Hoy, ¿qué tanto malestar te genera?', minimo: 'Nada', maximo: 'Muchísimo' },
      { id: 'que_has_intentado', tipo: 'largo', titulo: '¿Qué has intentado para sentirte mejor?', placeholder: 'Lo que te ha servido y lo que no' },
      { id: 'expectativas', tipo: 'largo', titulo: '¿Qué te gustaría que cambiara con la terapia?', placeholder: 'Cómo te darías cuenta de que vas mejor' },
    ],
  },
  {
    id: 'salud',
    titulo: 'Salud y cuerpo',
    descripcion: 'Tu bienestar físico también es parte del proceso.',
    preguntas: [
      { id: 'sueno', tipo: 'largo', titulo: '¿Cómo duermes?', placeholder: 'Horas, si te cuesta dormir, si despiertas en la noche…' },
      { id: 'alimentacion', tipo: 'largo', titulo: '¿Cómo está tu alimentación y tu apetito?', placeholder: 'Cambios recientes, horarios, relación con la comida' },
      { id: 'salud_fisica', tipo: 'largo', titulo: '¿Tienes alguna enfermedad o condición médica?', placeholder: 'Ej. migraña, tiroides, ninguna' },
      { id: 'medicamentos', tipo: 'largo', titulo: '¿Tomas algún medicamento o suplemento?', placeholder: 'Nombre y para qué, si lo sabes' },
      { id: 'consumo', tipo: 'largo', titulo: '¿Consumes alcohol, tabaco u otras sustancias? ¿Con qué frecuencia?', placeholder: 'Lo que quieras compartir' },
    ],
  },
  {
    id: 'historia',
    titulo: 'Tu historia',
    descripcion: 'Comparte solo lo que quieras. Lo demás se puede hablar en sesión.',
    preguntas: [
      { id: 'tratamientos_previos', tipo: 'largo', titulo: '¿Has ido antes a terapia o a psiquiatría? ¿Cómo te fue?', placeholder: 'Qué te sirvió y qué no' },
      { id: 'diagnosticos', tipo: 'largo', titulo: '¿Alguna vez te dieron un diagnóstico de salud mental?', placeholder: 'Ej. ansiedad, depresión, TDAH, ninguno' },
      { id: 'infancia', tipo: 'largo', titulo: '¿Cómo describirías tu infancia y tu familia de origen?', placeholder: 'Ambiente, relaciones, momentos importantes' },
      { id: 'eventos_dificiles', tipo: 'largo', titulo: '¿Hay experiencias difíciles que sientas que siguen pesando?', placeholder: 'Puedes nombrarlas sin dar detalles' },
    ],
  },
  {
    id: 'relaciones',
    titulo: 'Familia y relaciones',
    descripcion: 'Las personas a tu alrededor.',
    preguntas: [
      { id: 'familia_actual', tipo: 'largo', titulo: '¿Cómo es tu relación con tu familia hoy?', placeholder: 'Con quién te llevas bien, con quién hay tensión' },
      { id: 'salud_mental_familia', tipo: 'largo', titulo: '¿Alguien en tu familia ha tenido problemas de salud mental o de adicciones?', placeholder: 'Ej. mi papá tuvo depresión' },
      { id: 'pareja', tipo: 'largo', titulo: 'Si tienes pareja, ¿cómo describirías la relación?', placeholder: 'Opcional' },
      { id: 'red_apoyo', tipo: 'largo', titulo: '¿Con quién cuentas cuando lo necesitas?', placeholder: 'Amistades, familia, comunidad' },
    ],
  },
  {
    id: 'dia-a-dia',
    titulo: 'Tu día a día',
    descripcion: 'Lo que haces y lo que te sostiene.',
    preguntas: [
      { id: 'trabajo_estudio', tipo: 'largo', titulo: '¿Cómo te sientes con tu trabajo o tus estudios?', placeholder: 'Carga, satisfacción, cambios' },
      { id: 'descanso', tipo: 'largo', titulo: '¿Qué haces para descansar o desconectar?', placeholder: 'Música, ejercicio, salir, nada en particular…' },
      { id: 'fortalezas', tipo: 'largo', titulo: '¿Qué fortalezas reconoces en ti?', placeholder: 'Lo que otros valoran de ti o lo que te ha ayudado a salir adelante' },
    ],
  },
  {
    id: 'seguridad',
    titulo: 'Tu seguridad',
    descripcion: 'Preguntamos esto a todas las personas. Tu respuesta ayuda a cuidarte.',
    preguntas: [
      {
        id: 'riesgo', tipo: 'opciones', riesgo: true,
        titulo: 'En las últimas semanas, ¿has tenido pensamientos de hacerte daño o de no querer vivir?',
        opciones: ['No', 'Alguna vez, pero no recientemente', 'Sí, en las últimas semanas', 'Prefiero hablarlo en sesión'],
      },
      { id: 'riesgo_detalle', tipo: 'largo', titulo: 'Si quieres, cuéntanos un poco más', placeholder: 'Opcional' },
    ],
  },
  {
    id: 'cierre',
    titulo: 'Para cerrar',
    descripcion: 'Últimos detalles.',
    preguntas: [
      { id: 'algo_mas', tipo: 'largo', titulo: '¿Hay algo más que quieras que tu terapeuta sepa?', placeholder: 'Lo que sea' },
      { id: 'horarios', tipo: 'corto', titulo: '¿Qué días y horarios te acomodan mejor?', placeholder: 'Ej. martes y jueves por la tarde' },
    ],
  },
];

export const PREGUNTAS_ENTREVISTA = SECCIONES_ENTREVISTA.flatMap((s) => s.preguntas.map((p) => ({ ...p, seccion: s.titulo })));

/** ¿La respuesta a la pregunta de seguridad pide atención? (cualquier respuesta distinta de "No"). */
export const indicaRiesgo = (respuestas = {}) => {
  const r = respuestas.riesgo;
  return !!r && r !== 'No';
};

/** Mensaje de crisis que se muestra al consultante si indica riesgo. */
export const MENSAJE_CRISIS = 'Si en este momento sientes que podrías hacerte daño, no esperes a tu sesión: llama a la Línea de la Vida (800 911 2000, gratis, las 24 horas) o al 911. Tu terapeuta verá tu respuesta, pero esta plataforma no es un servicio de urgencias.';
