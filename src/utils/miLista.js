/**
 * miLista.js
 * Lógica de "Mi lista": sesiones recurrentes, avisos de confirmación y pagos.
 * Adaptada de la agenda de Oasis para funcionar sin servidor: todo vive en el navegador del terapeuta.
 *
 * Cada persona de la lista:
 *   { id, alias, telefono, proxima_sesion 'AAAA-MM-DD', hora_sesion 'HH:MM', frecuencia_dias (7, 14… 0 = una sola vez),
 *     modo 'fijo' | 'preguntar', aviso_dias_antes, hora_aviso 'HH:MM',
 *     confirmado_sesion, avisado_sesion, solo_esta_vez 'AAAA-MM-DD HH:MM', activo }
 * Cada pago: { id, cliente_id, sesion 'AAAA-MM-DD HH:MM', estado 'pagado' | 'pendiente', monto }
 *
 * Privacidad: la lista usa alias o códigos (C-01), nunca nombres completos.
 */
import { getActiveTherapist } from './storage';
import { guardarLocal } from './nube';

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MENSAJE_BASE = '¡Hola! Espero que estés muy bien. Solo para confirmar si nos vemos este {dia} a {hora_art}. Me avisas 🙂';
const DIA_MS = 86400000;

export const pad = (n) => String(n).padStart(2, '0');

export function parseHora(txt, def = [12, 0]) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((txt || '').trim());
  if (!m) return def;
  const h = +m[1], mi = +m[2];
  return h < 24 && mi < 60 ? [h, mi] : def;
}

export function parseFechaHora(txt) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec((txt || '').trim());
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

export const fmtFechaHora = (d) => d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
export const fmtFecha = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fmtHora = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const addDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const soloDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const difDias = (a, b) => Math.round((soloDia(a) - soloDia(b)) / DIA_MS);

export function frecuencia(c) {
  const n = parseInt(c.frecuencia_dias, 10);
  return Number.isFinite(n) ? n : 7;
}

/** Siguiente sesión regular después de `ahora`, según su fecha base y frecuencia. */
export function sesionRegular(c, ahora) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(c.proxima_sesion || '');
  if (!m) return null;
  const [h, mi] = parseHora(c.hora_sesion);
  let s = new Date(+m[1], +m[2] - 1, +m[3], h, mi);
  const f = frecuencia(c);
  while (s <= ahora) {
    if (f <= 0) return null;
    s = addDias(s, f);
  }
  return s;
}

/** Próxima sesión después de `ahora`, contando el cambio "solo esta vez". */
export function sesionLista(c, ahora) {
  const s = sesionRegular(c, ahora);
  const exc = parseFechaHora(c.solo_esta_vez);
  if (!exc) return s;
  const reemplazada = (x) => x && Math.abs(difDias(x, exc)) <= 3;
  if (exc > ahora) {
    if (!s || reemplazada(s) || exc < s) return exc;
    return s;
  }
  if (reemplazada(s)) {
    const f = frecuencia(c);
    return f > 0 ? addDias(s, f) : null;
  }
  return s;
}

export function proximasSesiones(c, ahora, n = 3) {
  const out = [];
  let t = ahora;
  for (let i = 0; i < n; i++) {
    const s = sesionLista(c, t);
    if (!s) break;
    out.push(s);
    t = s;
  }
  return out;
}

export function horaCorta(d) {
  const h = d.getHours() % 12 || 12;
  const ampm = d.getHours() < 12 ? 'am' : 'pm';
  return d.getMinutes() === 0 ? `${h} ${ampm}` : `${h}:${pad(d.getMinutes())} ${ampm}`;
}

export function rellenarMensaje(texto, s) {
  const h12 = s.getHours() % 12 || 12;
  return (texto || MENSAJE_BASE)
    .replaceAll('{dia}', DIAS[s.getDay()])
    .replaceAll('{hora}', horaCorta(s))
    .replaceAll('{hora_art}', (h12 === 1 ? 'la ' : 'las ') + horaCorta(s))
    .replaceAll('{fecha}', `${s.getDate()} de ${MESES[s.getMonth()]}`);
}

/** Momento en que toca mandar el aviso de confirmación (por defecto, 2 días antes a las 10 am). */
export function cuandoAviso(c, s) {
  if (!s) return null;
  const n = parseInt(c.aviso_dias_antes, 10);
  const dias = Number.isFinite(n) ? n : 2;
  const [h, mi] = parseHora(c.hora_aviso, [10, 0]);
  const d = addDias(soloDia(s), -dias);
  d.setHours(h, mi, 0, 0);
  return d;
}

export function nombreDia(d, ahora = new Date()) {
  const n = difDias(d, ahora);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  const dia = DIAS[d.getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

/** Arma lo que muestra el panel: hoy, toca avisar, próximos 7 días, para preguntar y quién debe. */
export function armarVista(clientes, pagos, ahora = new Date()) {
  const pagoDe = new Map(pagos.map((p) => [`${p.cliente_id}|${p.sesion}`, p]));
  const corte = new Date(ahora.getTime() - 60 * 60000); // hasta 1 h después de empezar sigue siendo "de hoy"
  const filas = clientes.map((c) => {
    const activo = c.activo !== false;
    const preguntar = c.modo === 'preguntar';
    const sesion = activo ? sesionLista(c, corte) : null;
    const clave = sesion ? fmtFechaHora(sesion) : '';
    const confirmado = !!clave && c.confirmado_sesion === clave;
    const aviso = cuandoAviso(c, sesion);
    const avisado = !!clave && c.avisado_sesion === clave;
    const tocaAvisar = activo && !preguntar && !!sesion && !confirmado && !avisado && aviso <= ahora && sesion > ahora;
    return { c, activo, preguntar, sesion, clave, confirmado, avisado, aviso, tocaAvisar, pago: clave ? pagoDe.get(`${c.id}|${clave}`) : null };
  });
  const activos = filas.filter((f) => f.activo);
  const hoy = activos.filter((f) => !f.preguntar && f.sesion && difDias(f.sesion, ahora) === 0).sort((a, b) => a.sesion - b.sesion);
  const semana = [];
  for (const f of activos) {
    if (f.preguntar) continue;
    for (const s of proximasSesiones(f.c, corte, 3)) {
      const d = difDias(s, ahora);
      if (d < 1 || d > 7) continue;
      const clave = fmtFechaHora(s);
      semana.push({ ...f, sesion: s, clave, confirmado: f.c.confirmado_sesion === clave, pago: pagoDe.get(`${f.c.id}|${clave}`) });
    }
  }
  semana.sort((a, b) => a.sesion - b.sesion);
  const preguntar = activos.filter((f) => f.preguntar);
  const tocaAvisar = activos.filter((f) => f.tocaAvisar).sort((a, b) => a.sesion - b.sesion);
  const inactivos = filas.filter((f) => !f.activo);
  return { filas, hoy, semana, preguntar, tocaAvisar, inactivos };
}

/** Cambios de cada botón. Devuelven solo los campos a guardar (o un error). */
export const acciones = {
  confirmo: (c, sesion) => ({ confirmado_sesion: fmtFechaHora(sesion) }),
  quitarConfirmo: () => ({ confirmado_sesion: '' }),
  avisado: (c, sesion) => ({ avisado_sesion: fmtFechaHora(sesion) }),
  soloEstaVez: (c, fecha, hora) => ({ solo_esta_vez: `${fecha} ${hora}` }),
  cambiarHorario: (c, fecha, hora) => ({ proxima_sesion: fecha, hora_sesion: hora, solo_esta_vez: '' }),
  /** "No viene": se salta la próxima sesión. */
  noViene: (c, ahora = new Date()) => {
    const prox = sesionLista(c, ahora);
    if (!prox) return { error: 'No tiene próxima sesión.' };
    const exc = parseFechaHora(c.solo_esta_vez);
    if (exc && exc.getTime() === prox.getTime()) return { solo_esta_vez: '' };
    const f = frecuencia(c);
    if (f <= 0) return { activo: false };
    const sig = addDias(prox, f);
    return { proxima_sesion: fmtFecha(sig), hora_sesion: fmtHora(sig) };
  },
};

/** Sesiones de un mes para el "mapa del mes": { 'AAAA-MM-DD': [fila, ...] }. Lo pasado sale de los pagos registrados. */
export function sesionesDelMes(clientes, pagos, anio, mes, ahora = new Date()) {
  const inicio = new Date(anio, mes, 1);
  const fin = new Date(anio, mes + 1, 1);
  const corte = new Date(ahora.getTime() - 60 * 60000);
  const pagoDe = new Map(pagos.map((p) => [`${p.cliente_id}|${p.sesion}`, p]));
  const porDia = {};
  const meter = (d, fila) => { (porDia[fmtFecha(d)] ||= []).push(fila); };
  if (fin > corte) {
    for (const c of clientes) {
      if (c.activo === false) continue;
      let t = new Date(Math.max(inicio.getTime() - 60000, corte.getTime()));
      for (let i = 0; i < 40; i++) {
        const s = sesionLista(c, t);
        if (!s || s >= fin) break;
        const clave = fmtFechaHora(s);
        meter(s, { c, sesion: s, clave, confirmado: c.confirmado_sesion === clave, pago: pagoDe.get(`${c.id}|${clave}`), preguntar: c.modo === 'preguntar', pasada: false });
        if (c.modo === 'preguntar') break;
        t = s;
      }
    }
  }
  const porId = new Map(clientes.map((c) => [c.id, c]));
  for (const p of pagos) {
    const s = parseFechaHora(p.sesion);
    const c = porId.get(p.cliente_id);
    if (!s || !c || s < inicio || s >= fin || s > corte) continue;
    meter(s, { c, sesion: s, clave: p.sesion, confirmado: false, pago: p, preguntar: false, pasada: true });
  }
  for (const k in porDia) porDia[k].sort((a, b) => a.sesion - b.sesion);
  return porDia;
}

/** Monto en texto sin símbolo de pesos: "4,275 pesos". */
export const pesos = (n) => `${Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })} pesos`;

// ---------- Almacenamiento local, separado por terapeuta ----------

const clave = (nombre) => `oasis_clinico_${getActiveTherapist()?.id || 'anon'}_lista_${nombre}`;
const leer = (nombre, def) => {
  try {
    const raw = localStorage.getItem(clave(nombre));
    return raw ? JSON.parse(raw) : def();
  } catch (_) {
    return def();
  }
};
const escribir = (nombre, valor) => guardarLocal(clave(nombre), JSON.stringify(valor));

/** Lista de ejemplo, relativa a hoy, con alias ficticios para que el panel no empiece vacío. */
function ejemplo() {
  const hoy = new Date();
  const dia = (n) => fmtFecha(addDias(hoy, n));
  return [
    { id: 'l-01', alias: 'C-01', telefono: '', proxima_sesion: dia(0), hora_sesion: '18:00', frecuencia_dias: 7, modo: 'fijo', activo: true },
    { id: 'l-02', alias: 'C-02', telefono: '', proxima_sesion: dia(1), hora_sesion: '16:00', frecuencia_dias: 7, modo: 'fijo', activo: true },
    { id: 'l-03', alias: 'C-03', telefono: '', proxima_sesion: dia(2), hora_sesion: '12:00', frecuencia_dias: 14, modo: 'fijo', activo: true },
    { id: 'l-04', alias: 'C-04', telefono: '', proxima_sesion: dia(4), hora_sesion: '19:30', frecuencia_dias: 7, modo: 'fijo', activo: true },
    { id: 'l-05', alias: 'C-05', telefono: '', proxima_sesion: dia(3), hora_sesion: '10:00', frecuencia_dias: 0, modo: 'preguntar', activo: true },
  ];
}

// Solo la cuenta de ejemplo arranca con personas de muestra
export const getLista = () => leer('clientes', () => (getActiveTherapist()?.isDemo ? ejemplo() : []));
export const saveLista = (lista) => escribir('clientes', lista);
export const getPagos = () => leer('pagos', () => []);
export const savePagos = (pagos) => escribir('pagos', pagos);
export const getAjustes = () => leer('ajustes', () => ({ mensaje: MENSAJE_BASE, precio: '' }));
export const saveAjustes = (a) => escribir('ajustes', a);
