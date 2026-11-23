// Datos de la demostración. Todo es inventado: nombres de usuario, historias y respuestas.
// Solo los ve la cuenta de ejemplo ("Iniciar sin cuenta"); una cuenta real empieza vacía.
// Las fechas se calculan desde hoy para que la demo siempre se vea al día.

const DIA = 86400000;
const hace = (dias, hora = 17) => { const d = new Date(Date.now() - dias * DIA); d.setHours(hora, 0, 0, 0); return d.toISOString(); };
const fechaDia = (dias) => hace(dias).slice(0, 10);

// ---------- Expedientes ----------
export const PACIENTES_DEMO = [
  {
    id: 'pac-001', codigo: 'C-01', nombre: 'Polilla 8', edad: 34, genero: 'Masculino', ocupacion: 'Desarrollador de software',
    telefono: '', contactoEmergencia: 'Hermana (dato guardado aparte)',
    motivoConsulta: 'Ataques de angustia desde hace cuatro meses: taquicardia, sensación de que "algo malo va a pasar" e insomnio de conciliación. Empezaron tras un ascenso con mucha más carga laboral.',
    antecedentes: 'Sin historial psiquiátrico. Episodio depresivo leve en 2021 tras la muerte de su abuelo. Consumo de cafeína alto (5 tazas al día).',
    diagnostico: 'Trastorno de pánico (CIE-11: 6B01), en evaluación.',
    estado: 'Activo', fechaIngreso: fechaDia(42), frecuencia: 'Semanal', honorarios: 900,
  },
  {
    id: 'pac-002', codigo: 'C-02', nombre: 'mango_azul', edad: 28, genero: 'Femenino', ocupacion: 'Diseñadora gráfica independiente',
    telefono: '', contactoEmergencia: 'Pareja (dato guardado aparte)',
    motivoConsulta: 'Preocupación constante por su trabajo y por "no estar a la altura". Revisa cada entrega muchas veces, posterga y luego se desvela para terminar.',
    antecedentes: 'Familia con alta exigencia académica. Terapia breve en la universidad. Sin medicación.',
    diagnostico: 'Ansiedad generalizada (CIE-11: 6B00) con rasgos perfeccionistas.',
    estado: 'Activo', fechaIngreso: fechaDia(21), frecuencia: 'Quincenal', honorarios: 950,
  },
  {
    id: 'pac-003', codigo: 'C-03', nombre: 'Atlas', edad: 41, genero: 'Masculino', ocupacion: 'Maestro de secundaria',
    telefono: '', contactoEmergencia: 'Esposa (dato guardado aparte)',
    motivoConsulta: 'Duelo por la muerte de su padre hace siete meses. Tristeza, irritabilidad con sus hijos y la sensación de "tener que estar bien para todos".',
    antecedentes: 'Fue el hijo que cuidó a su padre durante la enfermedad. Sin tratamientos previos. Duerme bien pero despierta cansado.',
    diagnostico: 'Duelo con síntomas depresivos moderados. Descartar duelo prolongado (CIE-11: 6B42).',
    estado: 'Activo', fechaIngreso: fechaDia(63), frecuencia: 'Quincenal', honorarios: 900,
  },
  {
    id: 'pac-004', codigo: 'C-04', nombre: 'Café Frío', edad: 23, genero: 'No binario', ocupacion: 'Estudiante de arquitectura',
    telefono: '', contactoEmergencia: 'Mamá (dato guardado aparte)',
    motivoConsulta: 'Mucha ansiedad al exponer en clase y en reuniones; evita participar y luego se siente mal consigo. Duerme poco por entregas.',
    antecedentes: 'Bullying en secundaria. Consumo ocasional de alcohol en fiestas "para soltarse".',
    diagnostico: 'Ansiedad social (CIE-11: 6B04) en evaluación.',
    estado: 'Activo', fechaIngreso: fechaDia(28), frecuencia: 'Semanal', honorarios: 750,
  },
  {
    id: 'pac-005', codigo: 'C-05', nombre: 'lluvia.lenta', edad: 37, genero: 'Femenino', ocupacion: 'Enfermera de urgencias',
    telefono: '', contactoEmergencia: 'Amiga (dato guardado aparte)',
    motivoConsulta: 'Agotamiento, desconexión emocional con pacientes y ganas de renunciar. Turnos rotativos.',
    antecedentes: 'Pidió espaciar las sesiones por cambio de horario en el hospital.',
    diagnostico: 'Síndrome de desgaste profesional (QD85).',
    estado: 'Pausa', fechaIngreso: fechaDia(90), frecuencia: 'Por acordar', honorarios: 850,
  },
];

// ---------- Notas de evolución ----------
export const NOTAS_DEMO = {
  'pac-001': [
    { id: 'n-101', fecha: hace(7), tipo: 'Nota SOAP · Sesión 5', contenido: 'S: Reporta un solo ataque esta semana, de menor intensidad (6/10). Logró quedarse en la junta usando la respiración.\nO: Más relajado, habla con menos prisa. Afecto congruente.\nA: Buena respuesta a la psicoeducación y a la exposición interoceptiva. Persisten pensamientos catastróficos sobre su salud.\nP: Continuar exposición (subir escaleras, girar en silla). Registro de pensamientos. Reducir café a 2 tazas.' },
    { id: 'n-102', fecha: hace(14), tipo: 'Nota SOAP · Sesión 4', contenido: 'S: Tres ataques, uno en el súper. Evitó el metro dos días.\nO: Ansioso al narrarlo, se toca el pecho.\nA: Aparece evitación agorafóbica incipiente. Se trabaja el ciclo del pánico.\nP: Practicar respiración diafragmática 2 veces al día. Iniciar jerarquía de exposición.' },
    { id: 'n-103', fecha: hace(35), tipo: 'Nota de primera sesión', contenido: 'Llega referido por su médico tras dos visitas a urgencias con estudios cardiacos normales. Describe ataques de 10 a 15 minutos. Se acuerda encuadre semanal, se aplica BAI y se explica el modelo cognitivo del pánico.' },
  ],
  'pac-002': [
    { id: 'n-201', fecha: hace(7), tipo: 'Nota SOAP · Sesión 2', contenido: 'S: "Si entrego algo con un error, van a pensar que no sirvo". Pasó 6 horas corrigiendo un logo ya aprobado.\nO: Habla rápido, se disculpa varias veces.\nA: Perfeccionismo con creencia nuclear de insuficiencia. Buena alianza.\nP: Experimento conductual: entregar un boceto "suficientemente bueno" y registrar qué pasa.' },
    { id: 'n-202', fecha: hace(21), tipo: 'Nota de primera sesión', contenido: 'Motivo: preocupación constante y desvelos por trabajo. GAD-7 de 14. Se acuerda frecuencia quincenal por costos. Objetivos: bajar la autoexigencia y recuperar el sueño.' },
  ],
  'pac-003': [
    { id: 'n-301', fecha: hace(14), tipo: 'Nota SOAP · Sesión 4', contenido: 'S: Lloró por primera vez desde el funeral, viendo una foto con su papá. "Sentí que por fin me tocaba a mí".\nO: Llanto contenido, luego alivio visible.\nA: Avance en la elaboración del duelo. Disminuye la irritabilidad en casa.\nP: Carta no enviada a su padre. Platicar con su esposa sobre repartir tareas.' },
    { id: 'n-302', fecha: hace(42), tipo: 'Nota SOAP · Sesión 2', contenido: 'S: Se describe como "el fuerte de la familia". Le cuesta hablar de su papá.\nO: Afecto aplanado, respuestas cortas.\nA: Duelo con evitación emocional y sobrecarga de rol de cuidador.\nP: Línea de vida con su padre. PHQ-9 de control en un mes.' },
  ],
  'pac-004': [
    { id: 'n-401', fecha: hace(7), tipo: 'Nota SOAP · Sesión 3', contenido: 'S: Expuso dos minutos en clase. "Me temblaba la voz pero nadie se rió".\nO: Se le ve con orgullo, sonríe al contarlo.\nA: Primera exposición exitosa; desconfirma la predicción de burla.\nP: Subir a 5 minutos. Trabajar el procesamiento posterior (rumiación después de exponer).' },
  ],
  'pac-005': [
    { id: 'n-501', fecha: hace(30), tipo: 'Nota de seguimiento', contenido: 'Se acuerda pausar el proceso por cambio de turnos. Tiene herramientas de autocuidado y sabe que puede regresar cuando quiera. Seguimiento por mensaje en un mes.' },
  ],
};

// ---------- Pruebas aplicadas ----------
export const PRUEBAS_DEMO = {
  'pac-001': [
    { id: 't-101', fecha: hace(8), testId: 'bai', nombreTest: 'Inventario de Ansiedad de Beck (BAI)', score: 22, maximo: 63, severidad: 'Moderada', interpretacion: 'Bajó 9 puntos desde la primera aplicación.', totalReactivos: 21 },
    { id: 't-102', fecha: hace(35), testId: 'bai', nombreTest: 'Inventario de Ansiedad de Beck (BAI)', score: 31, maximo: 63, severidad: 'Severa', interpretacion: 'Predominan síntomas físicos: palpitaciones, sensación de ahogo, miedo a morir.', totalReactivos: 21 },
    { id: 't-103', fecha: hace(35), testId: 'phq9', nombreTest: 'Cuestionario de Depresión PHQ-9', score: 8, maximo: 27, severidad: 'Leve', interpretacion: 'Síntomas depresivos leves, asociados a la ansiedad.', totalReactivos: 9 },
  ],
  'pac-002': [
    { id: 't-201', fecha: hace(21), testId: 'gad7', nombreTest: 'Escala de Ansiedad Generalizada (GAD-7)', score: 14, maximo: 21, severidad: 'Moderada', interpretacion: 'Preocupación difícil de controlar e irritabilidad casi todos los días.', totalReactivos: 7 },
    { id: 't-202', fecha: hace(20), testId: 'ders16', nombreTest: 'Escala de Dificultades en Regulación Emocional (DERS-16)', score: 52, maximo: 80, severidad: 'Elevada', interpretacion: 'Mayor dificultad en las áreas de metas y estrategias.', totalReactivos: 16 },
  ],
  'pac-003': [
    { id: 't-301', fecha: hace(14), testId: 'phq9', nombreTest: 'Cuestionario de Depresión PHQ-9', score: 9, maximo: 27, severidad: 'Leve', interpretacion: 'Bajó 4 puntos en un mes.', totalReactivos: 9 },
    { id: 't-302', fecha: hace(56), testId: 'phq9', nombreTest: 'Cuestionario de Depresión PHQ-9', score: 13, maximo: 27, severidad: 'Moderada', interpretacion: 'Anhedonia y cansancio la mayoría de los días. Sin ideación de riesgo.', totalReactivos: 9 },
  ],
  'pac-004': [
    { id: 't-401', fecha: hace(28), testId: 'gad7', nombreTest: 'Escala de Ansiedad Generalizada (GAD-7)', score: 11, maximo: 21, severidad: 'Moderada', interpretacion: 'Ansiedad centrada en situaciones de evaluación social.', totalReactivos: 7 },
    { id: 't-402', fecha: hace(27), testId: 'aaq2', nombreTest: 'Cuestionario de Aceptación y Acción (AAQ-II)', score: 31, maximo: 49, severidad: 'Inflexibilidad elevada', interpretacion: 'Tiende a evitar lo que le incomoda aunque le aleje de lo que valora.', totalReactivos: 7 },
  ],
  'pac-005': [
    { id: 't-501', fecha: hace(85), testId: 'phq9', nombreTest: 'Cuestionario de Depresión PHQ-9', score: 6, maximo: 27, severidad: 'Leve', interpretacion: 'Cansancio y desánimo ligados al trabajo.', totalReactivos: 9 },
  ],
};

// ---------- Informes ----------
export const INFORMES_DEMO = {
  'pac-001': [
    { id: 'i-101', fecha: hace(28), actualizado: hace(28), tipo: 'evaluacion', titulo: 'Informe de evaluación inicial', contenido: 'Motivo de consulta\nAtaques de angustia recurrentes desde hace cuatro meses, con dos visitas a urgencias y estudios cardiacos normales.\n\nInstrumentos\nEntrevista clínica, BAI (31, severa) y PHQ-9 (8, leve).\n\nImpresión diagnóstica\nTrastorno de pánico en evaluación, con evitación agorafóbica incipiente. Factores de mantenimiento: interpretación catastrófica de sensaciones corporales, alto consumo de cafeína y sobrecarga laboral.\n\nPlan\nTerapia cognitivo-conductual semanal: psicoeducación, respiración, exposición interoceptiva y reestructuración cognitiva. Reevaluar con BAI al mes.' },
  ],
  'pac-003': [
    { id: 'i-301', fecha: hace(10), actualizado: hace(10), tipo: 'seguimiento', titulo: 'Informe de seguimiento', contenido: 'Periodo\nDos meses de proceso, sesiones quincenales.\n\nEvolución\nDisminuyen la irritabilidad y el cansancio. Logra expresar tristeza en sesión y empieza a delegar tareas familiares. PHQ-9 bajó de 13 a 9.\n\nPendientes\nCulpa por decisiones médicas al final de la vida de su padre. Fechas significativas próximas (aniversario).\n\nPlan\nContinuar trabajo de duelo; preparar el aniversario con un ritual elegido por él.' },
  ],
};

// ---------- Sesiones en el cuaderno de cada caso ----------
const ses = (id, dias, titulo, resumen, transcripcion, nota) => ({ id, fecha: hace(dias), creada: hace(dias), titulo, resumen, transcripcion, nota, origen: 'audio' });

export const SESIONES_DEMO = {
  'pac-001': [
    ses('s-101', 35, 'Sesión 1 · Primera sesión', 'Primera sesión. Describe ataques de angustia desde un ascenso hace cuatro meses, con dos visitas a urgencias. Miedo central: "que me dé un infarto". Se explica el ciclo del pánico y se acuerda encuadre semanal.',
      'T: ¿Qué te trae por aquí?\nC: Pues desde que me ascendieron siento que me va a dar algo. Me late el corazón rapidísimo y ya fui dos veces a urgencias.\nT: ¿Qué te dijeron ahí?\nC: Que estoy bien, que es ansiedad. Pero se siente muy real.\nT: Se siente real porque tu cuerpo sí está reaccionando. Vamos a entender juntos qué pasa en esos momentos.'),
    ses('s-102', 28, 'Sesión 2', 'Se trabaja la conexión entre sensaciones y pensamientos. Identifica que el café y dormir poco disparan los ataques. Practica respiración diafragmática.',
      'C: Me di cuenta de que siempre me pasa en la tarde, después de mi tercer café.\nT: Qué buena observación. ¿Qué piensas justo antes de que suba la ansiedad?\nC: Que algo está mal con mi corazón.'),
    ses('s-103', 21, 'Sesión 3', 'Construye su jerarquía de situaciones temidas: metro, juntas largas, hacer ejercicio. Primera exposición interoceptiva en sesión (respiración rápida 30 segundos), ansiedad máxima 7/10 que bajó en tres minutos.',
      'T: ¿Cómo estuvo eso?\nC: Horrible al principio, pero sí bajó solo.\nT: Eso es justo lo que queremos que tu cuerpo aprenda.'),
    ses('s-104', 14, 'Sesión 4', 'Semana difícil: tres ataques y evitó el metro dos días. Se normaliza la recaída y se refuerza el plan de exposición.',
      'C: Siento que voy para atrás.\nT: Las semanas así son parte del proceso. Lo importante es que no dejaste de ir al trabajo.\nC: Eso sí.'),
    ses('s-105', 7, 'Sesión 5', 'Un solo ataque, menos intenso. Usó la respiración en una junta y se quedó. Persisten pensamientos sobre su salud; se inicia registro de pensamientos.',
      'C: Esta vez no me salí de la junta. Respiré y aguanté.\nT: ¿Qué pasó después?\nC: Se me pasó. Y nadie se dio cuenta.',
      'S: Un ataque en la semana (6/10). Se quedó en la junta usando la respiración.\nO: Más tranquilo, habla con menos prisa.\nA: Buena respuesta a la exposición. Persisten ideas catastróficas sobre su salud.\nP: Registro de pensamientos y continuar exposición. Reducir café a 2 tazas.'),
  ],
  'pac-002': [
    ses('s-201', 21, 'Sesión 1 · Primera sesión', 'Preocupación constante por su desempeño. Revisa sus diseños una y otra vez y se desvela. Teme que sus clientes "descubran que no es tan buena".',
      'C: Siento que si algo sale mal, se van a dar cuenta de que no sirvo.\nT: ¿Ha pasado alguna vez?\nC: No… pero podría.'),
    ses('s-202', 7, 'Sesión 2', 'Se identifica la regla "todo tiene que ser perfecto o no vale". Se plantea un experimento: entregar un boceto suficientemente bueno y observar la reacción del cliente.',
      'T: ¿Qué crees que pasaría si entregas algo al 80%?\nC: Que me lo regresan… o que ni lo notan, la verdad.',
      'S: Pasó 6 horas corrigiendo un logo ya aprobado.\nO: Se disculpa varias veces, habla rápido.\nA: Perfeccionismo con creencia de insuficiencia.\nP: Experimento conductual con un boceto "suficientemente bueno".'),
  ],
  'pac-003': [
    ses('s-301', 56, 'Sesión 1 · Primera sesión', 'Duelo por su padre, fallecido hace siete meses tras una enfermedad larga en la que él fue el cuidador principal. Se describe como "el fuerte de la familia".',
      'C: Mi mamá y mis hermanos se apoyan en mí. No me puedo caer.\nT: ¿Y en quién te apoyas tú?\nC: …No sé.'),
    ses('s-302', 42, 'Sesión 2', 'Evita hablar directamente de su papá. Se trabaja una línea de vida con momentos importantes juntos.',
      'T: ¿Qué es lo primero que recuerdas de él?\nC: Que me llevaba al futbol los domingos.'),
    ses('s-303', 28, 'Sesión 3', 'Aparece la culpa por decisiones médicas del final. Se valida y se separa la responsabilidad de la impotencia.',
      'C: A veces pienso que si lo hubiera llevado antes al hospital…\nT: Hiciste lo que podías con lo que sabías en ese momento.'),
    ses('s-304', 14, 'Sesión 4', 'Primer llanto desde el funeral, con alivio. Menos irritabilidad con sus hijos. Tarea: carta no enviada.',
      'C: Vi una foto de los dos y no pude parar de llorar.\nT: ¿Cómo te sentiste después?\nC: Más ligero. Como que por fin me tocaba a mí.',
      'S: Lloró por primera vez desde el funeral.\nO: Llanto contenido, luego alivio.\nA: Avance en la elaboración del duelo.\nP: Carta no enviada; repartir tareas en casa.'),
  ],
  'pac-004': [
    ses('s-401', 28, 'Sesión 1 · Primera sesión', 'Ansiedad al hablar en público y en grupos. Evita participar en clase y luego se critica. Antecedente de burlas en secundaria.',
      'C: Siento que todos me están viendo y que voy a decir algo tonto.\nT: ¿Qué es lo peor que imaginas que pasaría?\nC: Que se rían, como en la secu.'),
    ses('s-402', 14, 'Sesión 2', 'Se arma una jerarquía de exposición: preguntar en clase, opinar en equipo, exponer 2 minutos.',
      'T: ¿Por cuál quieres empezar?\nC: Por preguntar algo en clase. Eso sí me animo.'),
    ses('s-403', 7, 'Sesión 3', 'Expuso dos minutos. Le tembló la voz pero nadie se rió. Se trabaja la rumiación posterior.',
      'C: Me temblaba la voz, pero terminé.\nT: ¿Y qué pasó con la burla que esperabas?\nC: No pasó. Una compañera hasta me dijo que estuvo bien.'),
  ],
  'pac-005': [
    ses('s-501', 30, 'Sesión 6 · Pausa', 'Por el cambio a turnos nocturnos se acuerda pausar. Repasan herramientas de autocuidado y señales para regresar.',
      'C: Ahorita con los turnos no me da la vida.\nT: Está bien hacer una pausa. ¿Qué señales te dirían que es momento de volver?\nC: Cuando ya no quiera ir a trabajar ni un día.'),
  ],
};

// ---------- Entrevistas en línea (lado del consultante) ----------
const RESPUESTAS_NUBE = {
  edad: '26', ocupacion: 'Trabajo en una cafetería y estudio psicología en línea', estado_civil: 'En una relación', con_quien_vives: 'Con dos roomies',
  escolaridad: 'Preparatoria o bachillerato',
  motivo: 'Siento que ando apagada desde hace meses. Me cuesta levantarme y ya no disfruto lo que antes me gustaba, como dibujar.',
  desde_cuando: 'Como desde marzo', detonante: 'Me mudé de ciudad por la escuela y dejé a mi familia y amigas.',
  areas_afectadas: 'Duermo mucho, me cuesta concentrarme en las clases y casi no salgo.', intensidad: 7,
  que_has_intentado: 'Hacer ejercicio un par de veces, hablarlo con mi novio.', expectativas: 'Volver a tener ganas de hacer cosas y sentirme menos sola.',
  sueno: 'Duermo 9 o 10 horas y aun así despierto cansada.', alimentacion: 'Como a deshoras, a veces se me olvida comer.',
  salud_fisica: 'Ninguna que yo sepa.', medicamentos: 'Ninguno.', consumo: 'Alcohol algunos fines de semana.',
  tratamientos_previos: 'Nunca he ido, es mi primera vez.', diagnosticos: 'Ninguno.',
  infancia: 'Tranquila. Mis papás trabajaban mucho y yo cuidaba a mi hermano.', eventos_dificiles: 'El divorcio de mis papás cuando tenía 12.',
  familia_actual: 'Muy unida con mi mamá, distante con mi papá.', salud_mental_familia: 'Mi mamá tuvo depresión cuando yo era chica.',
  pareja: 'Bien, me apoya mucho aunque vive en otra ciudad.', red_apoyo: 'Mi novio y una amiga de la prepa.',
  trabajo_estudio: 'Me gusta lo que estudio pero me cuesta mucho concentrarme.', descanso: 'Ver series, aunque luego me siento culpable.',
  fortalezas: 'Soy empática y constante cuando algo me importa.', riesgo: 'No', riesgo_detalle: '',
  algo_mas: 'Me da un poco de miedo empezar, pero tengo ganas.', horarios: 'Martes y jueves después de las 6',
};

export const PORTAL_DEMO = [
  {
    id: 'demo-nube', usuario: 'nube_lenta', alias: 'nube_lenta', creado: hace(3),
    entrevista: { respuestas: RESPUESTAS_NUBE, completada: true, actualizada: hace(2) },
    consentimiento: { version: '2026-11', nombre_firma: 'nube_lenta', aceptado_en: hace(3), metodo: 'escrito' },
    riesgo: false,
  },
  {
    id: 'demo-orion', usuario: 'orion.77', alias: 'Orión', creado: hace(1),
    entrevista: { respuestas: { edad: '31', ocupacion: 'Chef', estado_civil: 'Soltera/o', con_quien_vives: 'Solo', escolaridad: 'Licenciatura', motivo: 'Me enojo muy rápido en el trabajo y ya tuve problemas con mi jefe.', desde_cuando: 'Desde hace un año', intensidad: 6 }, completada: false, actualizada: hace(1) },
    consentimiento: { version: '2026-11', nombre_firma: 'Orión', aceptado_en: hace(1), metodo: 'escrito' },
    riesgo: false,
  },
];
