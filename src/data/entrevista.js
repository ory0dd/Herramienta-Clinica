// Entrevista clínica inicial. La llena el consultante desde su cuenta, una pregunta a la vez.
// `etiqueta` es el título chiquito arriba de cada pregunta; `placeholder` lleva ejemplos para que sea fácil contestar.
// Cada terapeuta puede editar, quitar o agregar preguntas aquí. Los `id` no deben repetirse:
// las respuestas se guardan con ese id.
//
// Tipos: 'corto' (una línea), 'largo' (párrafo), 'opciones' (elegir una) y 'escala' (0 a 10).

export const SECCIONES_ENTREVISTA = [
  {
    id: 'sobre-ti',
    titulo: 'Sobre ti',
    descripcion: 'Para conocerte un poco. Puedes usar un alias.',
    preguntas: [
      { id: 'nombre_preferido', tipo: 'corto', etiqueta: 'Tu nombre', titulo: '¿Cómo te gusta que te digan?', placeholder: 'Tu nombre o el alias con el que te sientas más cómodo' },
      { id: 'edad', tipo: 'corto', etiqueta: 'Tu edad', titulo: '¿Cuántos años tienes?', placeholder: 'Ej. 29' },
      { id: 'ocupacion', tipo: 'corto', etiqueta: 'Tus días', titulo: '¿A qué le dedicas tu tiempo en el día a día?', placeholder: 'Ej. "Estudio diseño y hago música", "Trabajo en ventas", "Ando buscando qué rumbo tomar"' },
      { id: 'estado_civil', tipo: 'opciones', etiqueta: 'Pareja', titulo: '¿Cuál es tu situación de pareja?', opciones: ['Soltera/o', 'En una relación', 'Casada/o o en unión libre', 'Separada/o o divorciada/o', 'Viuda/o', 'Prefiero no decir'] },
      { id: 'con_quien_vives', tipo: 'corto', etiqueta: 'Tu casa', titulo: '¿Con quién vives?', placeholder: 'Ej. "Con mi pareja y mi hija", "Solo", "Con mis papás"' },
      { id: 'escolaridad', tipo: 'opciones', etiqueta: 'Estudios', titulo: '¿Cuál es tu último grado de estudios?', opciones: ['Primaria', 'Secundaria', 'Preparatoria o bachillerato', 'Licenciatura', 'Posgrado', 'Otro'] },
    ],
  },
  {
    id: 'motivo',
    titulo: 'Lo que te trae',
    descripcion: 'Cuéntalo con tus palabras. No hay respuestas correctas.',
    preguntas: [
      { id: 'motivo', tipo: 'largo', etiqueta: '¿Qué te trae por aquí?', titulo: '¿Qué sientes que traes en la cabeza o qué te motivó a buscar terapia?', placeholder: 'Ej. "Siento que ando muy acelerado y me cuesta desconectar", "Me siento abrumada sin una razón clara", "Quiero poner orden en mis ideas"' },
      { id: 'desde_cuando', tipo: 'corto', etiqueta: 'El tiempo que llevas con esto', titulo: '¿Desde hace cuánto lo vienes sintiendo?', placeholder: 'Ej. "Como tres meses", "Desde una ruptura", "Siento que desde la adolescencia"' },
      { id: 'detonante', tipo: 'largo', etiqueta: '¿Con qué coincidió?', titulo: '¿Pasó algo por esas fechas que sientas que tiene que ver?', placeholder: 'Ej. "Un cambio de trabajo", "Una pérdida", "Una mudanza", "La verdad no sé, por eso quiero explorarlo"' },
      { id: 'areas_afectadas', tipo: 'largo', etiqueta: '¿Cómo te está pegando?', titulo: '¿En qué partes de tu vida o de tu rutina sientes que más te afecta?', placeholder: 'Ej. "Me cuesta concentrarme", "Duermo mal", "Me dan ganas de aislarme", "Discuto más con mi pareja"' },
      { id: 'intensidad', tipo: 'escala', etiqueta: 'Hoy', titulo: 'Del 0 al 10, ¿qué tanto malestar te genera hoy?', minimo: 'Nada', maximo: 'Muchísimo' },
      { id: 'que_has_intentado', tipo: 'largo', etiqueta: 'Lo que has probado', titulo: '¿Qué has intentado para sentirte mejor?', placeholder: 'Ej. "Hacer ejercicio me ayuda un rato", "Hablarlo con una amiga", "Nada todavía"' },
      { id: 'expectativas', tipo: 'largo', etiqueta: 'Lo que esperas', titulo: '¿Qué te gustaría que cambiara con la terapia?', placeholder: 'Ej. "Poder dormir tranquila", "Entender por qué reacciono así", "Sentirme menos solo"' },
    ],
  },
  {
    id: 'salud',
    titulo: 'Cuerpo y descanso',
    descripcion: 'Tu bienestar físico también es parte del proceso.',
    preguntas: [
      { id: 'sueno', tipo: 'largo', etiqueta: 'Descanso', titulo: '¿Cómo anda tu descanso? ¿Cuántas horas duermes y qué tan reparador lo sientes?', placeholder: 'Ej. "Unas 6 horas pero despierto cansado", "Me cuesta dormirme porque la cabeza no para", "Varía mucho"' },
      { id: 'alimentacion', tipo: 'largo', etiqueta: 'Comida', titulo: '¿Cómo está tu alimentación y tu apetito últimamente?', placeholder: 'Ej. "Como a deshoras", "Se me quitó el hambre", "Como más cuando estoy estresada"' },
      { id: 'salud_fisica', tipo: 'largo', etiqueta: 'Salud física', titulo: '¿Tienes alguna enfermedad o condición médica?', placeholder: 'Ej. "Migraña", "Tiroides", "Ninguna que yo sepa"' },
      { id: 'medicamentos', tipo: 'largo', etiqueta: 'Medicamentos', titulo: '¿Tomas algún medicamento o suplemento que sea importante mencionar?', placeholder: 'Ej. "Uno recetado por mi psiquiatra", "Vitaminas", "Ninguno"' },
      { id: 'consumo', tipo: 'largo', etiqueta: 'Consumo', titulo: '¿Consumes alcohol, tabaco u otras sustancias? ¿Qué tan seguido?', placeholder: 'Ej. "Alcohol los fines de semana", "Cannabis ocasional para relajarme", "No consumo nada". Comparte solo lo que quieras.' },
    ],
  },
  {
    id: 'historia',
    titulo: 'Tu historia',
    descripcion: 'Comparte solo lo que quieras. Lo demás se puede hablar en sesión.',
    preguntas: [
      { id: 'tratamientos_previos', tipo: 'largo', etiqueta: 'Acompañamientos previos', titulo: '¿Has ido antes a terapia o a psiquiatría? ¿Cómo fue tu experiencia?', placeholder: 'Ej. "Fui unos meses el año pasado y me ayudó", "Nunca he ido, es mi primera vez"' },
      { id: 'diagnosticos', tipo: 'largo', etiqueta: 'Diagnósticos', titulo: '¿Alguna vez te dieron un diagnóstico de salud mental?', placeholder: 'Ej. "Ansiedad hace un año", "TDAH de niña", "Ninguno"' },
      { id: 'infancia', tipo: 'largo', etiqueta: 'De dónde vienes', titulo: '¿Cómo describirías tu infancia y tu familia de origen?', placeholder: 'Ej. "Una casa con mucha exigencia", "Fui la hermana mayor y cuidaba a todos", "Tranquila, pero poco cariñosa"' },
      { id: 'eventos_dificiles', tipo: 'largo', etiqueta: 'Lo que todavía pesa', titulo: '¿Hay experiencias difíciles que sientas que te siguen pesando?', placeholder: 'Puedes nombrarlas sin dar detalles. Lo demás se habla en sesión, cuando estés lista o listo.' },
    ],
  },
  {
    id: 'relaciones',
    titulo: 'Tu gente',
    descripcion: 'Las personas a tu alrededor.',
    preguntas: [
      { id: 'familia_actual', tipo: 'largo', etiqueta: 'Tu familia hoy', titulo: '¿Cómo es tu relación con tu familia hoy?', placeholder: 'Ej. "Muy unida con mi mamá, distante con mi papá", "Hay tensión con mis hermanos"' },
      { id: 'salud_mental_familia', tipo: 'largo', etiqueta: 'En tu familia', titulo: '¿Alguien en tu familia ha vivido depresión, ansiedad, adicciones u otra dificultad de salud mental?', placeholder: 'Ej. "Mi papá tuvo depresión", "Un tío con alcoholismo", "No que yo sepa"' },
      { id: 'pareja', tipo: 'largo', etiqueta: 'Pareja', titulo: 'Si tienes pareja, ¿cómo describirías la relación?', placeholder: 'Si no aplica, puedes saltar esta pregunta.' },
      { id: 'red_apoyo', tipo: 'largo', etiqueta: 'Tu red', titulo: '¿Con quién cuentas cuando lo necesitas?', placeholder: 'Ej. "Con mi mejor amiga", "Con mi hermana", "La verdad, con casi nadie"' },
    ],
  },
  {
    id: 'dia-a-dia',
    titulo: 'Tu día a día',
    descripcion: 'Lo que haces y lo que te sostiene.',
    preguntas: [
      { id: 'trabajo_estudio', tipo: 'largo', etiqueta: 'Trabajo o estudios', titulo: '¿Cómo te sientes con tu trabajo o tus estudios?', placeholder: 'Ej. "Mucha carga y poco reconocimiento", "Me gusta, pero me satura", "Estoy sin trabajo y me pesa"' },
      { id: 'descanso', tipo: 'largo', etiqueta: 'Tus formas de desconectar', titulo: 'Cuando necesitas bajarle a las revoluciones, ¿qué te ayuda?', placeholder: 'Ej. "Caminar con música", "Dibujar o escribir", "Hacer ejercicio", "Me cuesta mucho relajarme"' },
      { id: 'fortalezas', tipo: 'largo', etiqueta: 'Lo que te sostiene', titulo: '¿Qué fortalezas reconoces en ti?', placeholder: 'Ej. "Soy constante", "Sé escuchar", "Siempre encuentro cómo salir adelante"' },
    ],
  },
  {
    id: 'seguridad',
    titulo: 'Tu seguridad',
    descripcion: 'Preguntamos esto a todas las personas. Tu respuesta ayuda a cuidarte.',
    preguntas: [
      {
        id: 'riesgo', tipo: 'opciones', riesgo: true, etiqueta: 'Tu seguridad',
        titulo: 'En las últimas semanas, ¿has tenido pensamientos de hacerte daño o de no querer vivir?',
        opciones: ['No', 'Alguna vez, pero no recientemente', 'Sí, en las últimas semanas', 'Prefiero hablarlo en sesión'],
      },
      { id: 'riesgo_detalle', tipo: 'largo', etiqueta: 'Si quieres contar más', titulo: 'Si quieres, cuéntanos un poco más', placeholder: 'Es opcional. Tu terapeuta lo leerá con cuidado.' },
    ],
  },
  {
    id: 'cierre',
    titulo: 'Para cerrar',
    descripcion: 'Últimos detalles.',
    preguntas: [
      { id: 'algo_mas', tipo: 'largo', etiqueta: 'Algo más', titulo: '¿Hay algo más que quieras que tu terapeuta sepa?', placeholder: 'Lo que sea: una duda, un miedo, algo que te gustaría trabajar primero…' },
      { id: 'horarios', tipo: 'corto', etiqueta: 'Horarios', titulo: '¿Qué días y horarios te acomodan mejor?', placeholder: 'Ej. "Martes y jueves por la tarde"' },
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
