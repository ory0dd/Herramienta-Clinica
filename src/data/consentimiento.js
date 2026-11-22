// Consentimiento informado que acepta el consultante antes de su entrevista.
// ES UNA PLANTILLA: cada terapeuta debe revisarla y adaptarla a su encuadre (honorarios, cancelaciones,
// modalidad, aviso de privacidad) y, si lo necesita, validarla con asesoría legal.
// Si cambias el texto, cambia también la VERSION para saber qué versión aceptó cada persona.

export const VERSION_CONSENTIMIENTO = '2026-11';

// Política de citas: cambia estos números a los de tu consulta (en horas).
export const POLITICA_CITAS = {
  anticipo: 48,   // con cuánto tiempo se aparta una cita con anticipo
  reagendar: 24,  // hasta cuánto antes se puede mover sin costo
  limite: 6,      // con menos de este aviso, la sesión se cobra
};

export const CONSENTIMIENTO = {
  titulo: 'Consentimiento informado',
  introduccion:
    'Antes de empezar, es importante que conozcas cómo funciona el proceso terapéutico y cómo se cuida tu información. Lee cada punto con calma; si tienes dudas, puedes hablarlas en tu primera sesión.',
  puntos: [
    {
      id: 'encuadre',
      titulo: 'Cómo funciona la terapia',
      texto:
        'Las sesiones, su duración, frecuencia, honorarios y política de cancelación se acuerdan con tu terapeuta desde el inicio. La terapia es un proceso colaborativo: los resultados dependen del trabajo conjunto y no pueden garantizarse.',
    },
    {
      id: 'citas',
      titulo: 'Citas, anticipo y cancelaciones',
      texto:
        `Las citas se apartan con un anticipo y al menos ${POLITICA_CITAS.anticipo} horas de anticipación. Puedes reagendar sin costo avisando con ${POLITICA_CITAS.reagendar} horas o más; tu anticipo pasa a la nueva fecha. Si cancelas o cambias con menos de ${POLITICA_CITAS.limite} horas, o no te presentas, la sesión se considera tomada.`,
    },
    {
      id: 'confidencialidad',
      titulo: 'Confidencialidad y sus límites',
      texto:
        'Lo que compartas es confidencial y está protegido por el secreto profesional. Las únicas excepciones son: riesgo grave para tu vida o la de otras personas, sospecha de abuso hacia menores o personas vulnerables, y una orden de autoridad competente. En esos casos, tu terapeuta compartirá solo lo indispensable.',
    },
    {
      id: 'expediente',
      titulo: 'Tu expediente digital',
      texto:
        'Tu información se guarda en un expediente digital, en la base de datos de tu terapeuta, con acceso protegido por contraseña. Se conserva conforme a la NOM-004-SSA3-2012.',
    },
    {
      id: 'ia',
      titulo: 'Uso de herramientas de apoyo',
      texto:
        'Tu terapeuta puede usar un asistente de inteligencia artificial para ordenar notas o preparar sesiones. Si lo hace, la información se comparte sin tu nombre ni datos de contacto, y las decisiones clínicas siempre las toma tu terapeuta.',
    },
    {
      id: 'datos',
      titulo: 'Tus datos personales',
      texto:
        'Tus datos se tratan conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Puedes pedir en cualquier momento acceder a ellos, corregirlos, cancelarlos u oponerte a su uso.',
    },
    {
      id: 'voluntario',
      titulo: 'Tu decisión es libre',
      texto:
        'Participar es voluntario. Puedes retirar este consentimiento y terminar el proceso cuando lo decidas, sin dar explicaciones.',
    },
    {
      id: 'urgencias',
      titulo: 'No es un servicio de urgencias',
      texto:
        'Esta plataforma no atiende crisis. Si en algún momento sientes que estás en peligro, llama a la Línea de la Vida (800 911 2000, gratis, las 24 horas) o al 911.',
    },
  ],
  firma: 'Al confirmar (con tu nombre escrito o con tu voz) declaras que leíste este documento, que tus dudas pueden resolverse en sesión y que aceptas iniciar el proceso.',
};
