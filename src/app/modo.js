// Con qué lado entra este dispositivo: 'clinico' (consultorio) o 'consultante' (portal). Se recuerda.
const CLAVE = 'oasis_clinico_modo';
export const modoGuardado = () => { try { return localStorage.getItem(CLAVE); } catch (_) { return null; } };
export const elegirModo = (modo) => {
  try { localStorage.setItem(CLAVE, modo); } catch (_) { /* sin almacenamiento: se elige cada vez */ }
  window.location.hash = modo === 'consultante' ? '#consultante' : '#/agenda/hoy';
};
export const volverAlInicio = () => {
  try { localStorage.removeItem(CLAVE); } catch (_) { /* nada */ }
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};
export const recordarModo = (modo) => { try { localStorage.setItem(CLAVE, modo); } catch (_) { /* nada */ } };
