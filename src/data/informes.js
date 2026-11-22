// Tipos de informe y su estructura base. Cada terapeuta puede ajustar los textos aquí.
// `plantilla` recibe el expediente y lo que ya se registró, y devuelve el borrador inicial.

const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

export const TIPOS_INFORME = [
  {
    id: 'evaluacion',
    nombre: 'Informe de evaluación',
    plantilla: (p, { pruebas = [] } = {}) => [
      'Motivo de evaluación',
      p.motivoConsulta || '',
      '',
      'Instrumentos aplicados',
      pruebas.length ? pruebas.map((t) => `- ${t.nombreTest} (${fecha(t.fecha)}): ${t.score}${t.maximo ? ` de ${t.maximo}` : ''} puntos, ${t.severidad}.`).join('\n') : '',
      '',
      'Resultados e interpretación',
      '',
      '',
      'Impresión diagnóstica',
      p.diagnostico || '',
      '',
      'Recomendaciones',
      '',
    ].join('\n'),
  },
  {
    id: 'seguimiento',
    nombre: 'Informe de seguimiento',
    plantilla: (p) => [
      'Periodo que abarca',
      `Desde ${p.fechaIngreso ? fecha(p.fechaIngreso) : '___'} hasta ${fecha(new Date().toISOString())}.`,
      '',
      'Objetivos trabajados',
      '',
      '',
      'Avances observados',
      '',
      '',
      'Dificultades',
      '',
      '',
      'Plan para el siguiente periodo',
      '',
    ].join('\n'),
  },
  {
    id: 'alta',
    nombre: 'Informe de alta',
    plantilla: (p) => [
      'Motivo de consulta inicial',
      p.motivoConsulta || '',
      '',
      'Desarrollo del proceso',
      '',
      '',
      'Logros al cierre',
      '',
      '',
      'Recomendaciones de seguimiento',
      '',
    ].join('\n'),
  },
  {
    id: 'constancia',
    nombre: 'Constancia de asistencia',
    plantilla: (p) =>
      `Por medio de la presente hago constar que ${p.nombre} acude a proceso psicoterapéutico conmigo desde ${p.fechaIngreso ? fecha(p.fechaIngreso) : '___'}, con una frecuencia ${String(p.frecuencia || 'semanal').toLowerCase()}.\n\nSe extiende la presente a petición de la persona interesada, para los fines que a ella convengan.`,
  },
  {
    id: 'referencia',
    nombre: 'Carta de referencia',
    plantilla: (p) => [
      'A quien corresponda:',
      '',
      `Refiero a ${p.nombre} para valoración por ___.`,
      '',
      'Motivo de la referencia',
      p.motivoConsulta || '',
      '',
      'Información relevante',
      '',
      '',
      'Quedo a sus órdenes para cualquier información adicional.',
    ].join('\n'),
  },
];

export const tipoInforme = (id) => TIPOS_INFORME.find((t) => t.id === id) || TIPOS_INFORME[0];
