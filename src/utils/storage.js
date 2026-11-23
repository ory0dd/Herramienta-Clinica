/**
 * storage.js
 * Capa de almacenamiento y aislamiento estricto por terapeuta.
 * Soporta modo local offline y conexión transparente a Supabase.
 */

import { guardarLocal } from './nube';
import { PACIENTES_DEMO, NOTAS_DEMO, PRUEBAS_DEMO, INFORMES_DEMO } from '../data/demo';

const STORAGE_PREFIX = 'oasis_clinico_';

// Obtener o guardar sesión del terapeuta activo
export const getActiveTherapist = () => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}active_user`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo sesión activa:', e);
  }
  // Usuario por defecto si no ha iniciado sesión
  return {
    id: 'demo-terapeuta-01',
    email: 'demo@ejemplo.com',
    nombre: 'Cuenta de ejemplo',
    cedula: 'Sin cédula registrada',
    enfoque: 'Cognitivo-Conductual y Fenomenológico',
    isDemo: true
  };
};

export const setActiveTherapist = (therapist) => {
  localStorage.setItem(`${STORAGE_PREFIX}active_user`, JSON.stringify(therapist));
};

export const logoutTherapist = () => {
  localStorage.removeItem(`${STORAGE_PREFIX}active_user`);
};

// Clave con namespace del terapeuta
const getScopedKey = (keyName) => {
  const therapist = getActiveTherapist();
  const userId = therapist ? therapist.id : 'anon';
  return `${STORAGE_PREFIX}${userId}_${keyName}`;
};

// Pacientes de la demostración (con su historia completa en src/data/demo.js)
const DEFAULT_PATIENTS = PACIENTES_DEMO;
const esDemo = () => !!getActiveTherapist()?.isDemo;

// Nombres de ejemplo de versiones anteriores que se cambian por alias al leer
const NOMBRES_VIEJOS = ['Carlos E. Mendoza', 'Elena R. Garza', 'Consultante A', 'Consultante B'];
const limpiarEjemplo = (p) => {
  if (!NOMBRES_VIEJOS.includes(p.nombre)) return p;
  const nuevo = DEFAULT_PATIENTS.find((d) => d.id === p.id);
  return nuevo ? { ...p, nombre: nuevo.nombre, ocupacion: nuevo.ocupacion, telefono: nuevo.telefono, contactoEmergencia: nuevo.contactoEmergencia } : p;
};

export const getPatients = () => {
  try {
    const raw = localStorage.getItem(getScopedKey('patients'));
    if (raw) {
      const lista = JSON.parse(raw).map(limpiarEjemplo);
      // En la demo, agrega los expedientes de ejemplo nuevos que aún no estén
      if (!esDemo()) return lista;
      const faltan = DEFAULT_PATIENTS.filter((d) => !lista.some((p) => p.id === d.id));
      return faltan.length ? [...lista, ...faltan] : lista;
    }
    // Si no existen aún, guardar y devolver los de muestra
    // Solo la cuenta de ejemplo arranca con pacientes de muestra; una cuenta real empieza vacía
    const base = getActiveTherapist().isDemo ? DEFAULT_PATIENTS : [];
    guardarLocal(getScopedKey('patients'), JSON.stringify(base));
    return base;
  } catch (e) {
    console.error('Error leyendo pacientes:', e);
    return DEFAULT_PATIENTS;
  }
};

export const savePatients = (patients) => {
  guardarLocal(getScopedKey('patients'), JSON.stringify(patients));
};

export const addPatient = (patientData) => {
  const current = getPatients();
  const nextNum = current.length + 1;
  const newPatient = {
    id: `pac-${Date.now()}`,
    codigo: `C-${String(nextNum).padStart(2, '0')}`,
    fechaIngreso: new Date().toISOString().split('T')[0],
    estado: 'Activo',
    honorarios: 900,
    ...patientData
  };
  const updated = [newPatient, ...current];
  savePatients(updated);
  return newPatient;
};

export const updatePatient = (id, updatedFields) => {
  const current = getPatients();
  const updated = current.map(p => p.id === id ? { ...p, ...updatedFields } : p);
  savePatients(updated);
  return updated.find(p => p.id === id);
};

export const deletePatient = (id) => {
  const current = getPatients();
  const updated = current.filter(p => p.id !== id);
  savePatients(updated);
};

// Notas de evolución por paciente
export const getPatientNotes = (patientId) => {
  try {
    const raw = localStorage.getItem(getScopedKey(`notes_${patientId}`));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return esDemo() ? (NOTAS_DEMO[patientId] || []) : [];
};

export const savePatientNote = (patientId, note) => {
  const current = getPatientNotes(patientId);
  const newNote = {
    id: `note-${Date.now()}`,
    fecha: new Date().toISOString(),
    ...note
  };
  const updated = [newNote, ...current];
  guardarLocal(getScopedKey(`notes_${patientId}`), JSON.stringify(updated));
  return newNote;
};

// Informes por paciente (evaluación, seguimiento, alta, constancias…)
export const getPatientInformes = (patientId) => {
  try {
    const raw = localStorage.getItem(getScopedKey(`informes_${patientId}`));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return esDemo() ? (INFORMES_DEMO[patientId] || []) : [];
};

export const savePatientInforme = (patientId, informe) => {
  const current = getPatientInformes(patientId);
  const ahora = new Date().toISOString();
  let guardado;
  let updated;
  if (informe.id && current.some((i) => i.id === informe.id)) {
    updated = current.map((i) => (i.id === informe.id ? (guardado = { ...i, ...informe, actualizado: ahora }) : i));
  } else {
    guardado = { id: `inf-${Date.now()}`, fecha: ahora, actualizado: ahora, ...informe };
    updated = [guardado, ...current];
  }
  guardarLocal(getScopedKey(`informes_${patientId}`), JSON.stringify(updated));
  return guardado;
};

export const deletePatientInforme = (patientId, informeId) => {
  const updated = getPatientInformes(patientId).filter((i) => i.id !== informeId);
  guardarLocal(getScopedKey(`informes_${patientId}`), JSON.stringify(updated));
};

// Resultados de pruebas psicométricas por paciente
export const getPatientTestResults = (patientId) => {
  try {
    const raw = localStorage.getItem(getScopedKey(`tests_${patientId}`));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return esDemo() ? (PRUEBAS_DEMO[patientId] || []) : [];
};

export const savePatientTestResult = (patientId, testResult) => {
  const current = getPatientTestResults(patientId);
  const newResult = {
    id: `test-${Date.now()}`,
    fecha: new Date().toISOString(),
    ...testResult
  };
  const updated = [newResult, ...current];
  guardarLocal(getScopedKey(`tests_${patientId}`), JSON.stringify(updated));
  return newResult;
};

// Agenda y pagos
const DEFAULT_APPOINTMENTS = [
  {
    id: 'apt-01',
    patientId: 'pac-001',
    pacienteNombre: 'Polilla 8 (C-01)',
    fecha: new Date().toISOString().split('T')[0],
    hora: '17:00',
    modalidad: 'Presencial',
    monto: 900,
    estadoPago: 'pagado',
    asistencia: 'confirmada'
  },
  {
    id: 'apt-02',
    patientId: 'pac-002',
    pacienteNombre: 'mango_azul (C-02)',
    fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    hora: '18:30',
    modalidad: 'Online (Videollamada)',
    monto: 950,
    estadoPago: 'pendiente',
    asistencia: 'pendiente'
  }
];

export const getAppointments = () => {
  try {
    const raw = localStorage.getItem(getScopedKey('appointments'));
    if (raw) return JSON.parse(raw).map((a) => (NOMBRES_VIEJOS.some((n) => (a.pacienteNombre || '').startsWith(n)) ? { ...a, pacienteNombre: (DEFAULT_APPOINTMENTS.find((d) => d.id === a.id) || a).pacienteNombre } : a));
    const base = getActiveTherapist().isDemo ? DEFAULT_APPOINTMENTS : [];
    guardarLocal(getScopedKey('appointments'), JSON.stringify(base));
    return base;
  } catch (e) {
    return DEFAULT_APPOINTMENTS;
  }
};

export const saveAppointments = (appointments) => {
  guardarLocal(getScopedKey('appointments'), JSON.stringify(appointments));
};

export const addAppointment = (aptData) => {
  const current = getAppointments();
  const newApt = {
    id: `apt-${Date.now()}`,
    estadoPago: 'pendiente',
    asistencia: 'pendiente',
    ...aptData
  };
  const updated = [newApt, ...current];
  saveAppointments(updated);
  return newApt;
};

export const updateAppointment = (id, fields) => {
  const current = getAppointments();
  const updated = current.map(a => a.id === id ? { ...a, ...fields } : a);
  saveAppointments(updated);
  return updated.find(a => a.id === id);
};

// Datos de la persona dueña de la app, para firmar informes y constancias
export const getPerfil = () => {
  try { return JSON.parse(localStorage.getItem(getScopedKey('perfil')) || '{}'); } catch (_) { return {}; }
};
export const savePerfil = (perfil) => guardarLocal(getScopedKey('perfil'), JSON.stringify(perfil));
