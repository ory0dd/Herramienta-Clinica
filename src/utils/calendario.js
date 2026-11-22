/**
 * calendario.js
 * Conexión con Google Calendar desde el navegador (sin servidor).
 * - Usa el inicio de sesión de Google (Google Identity Services) con un Client ID público (VITE_GOOGLE_CLIENT_ID).
 * - Pide solo el permiso "calendar.app.created": la app crea su propio calendario ("aniima · sesiones")
 *   y solo puede ver y cambiar ese calendario; los demás calendarios de la persona quedan fuera de su alcance.
 * - Cada sincronización pone las sesiones de las próximas cuatro semanas y quita las que ya no van.
 *   Los eventos llevan solo el alias (C-01), nunca nombres ni teléfonos.
 */
import { proximasSesiones, fmtFechaHora, addDias, getGoogle, saveGoogle } from './miLista';
import { NOMBRE } from '../data/marca';

export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const ALCANCE = 'https://www.googleapis.com/auth/calendar.app.created';
const API = 'https://www.googleapis.com/calendar/v3';
const DIAS_A_SINCRONIZAR = 28;
const DURACION_MIN = 50;

let token = null; // { valor, vence }

function cargarGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => mal(new Error('No se pudo cargar el inicio de sesión de Google. Revisa tu internet.'));
    document.head.appendChild(s);
  });
}

/** Pide permiso a Google (abre su ventana la primera vez). Debe llamarse desde un toque del usuario. */
export async function pedirPermiso() {
  if (!CLIENT_ID) throw new Error('Falta el Client ID de Google (VITE_GOOGLE_CLIENT_ID). Revisa la guía.');
  if (token && token.vence > Date.now() + 60000) return token.valor;
  await cargarGoogle();
  return new Promise((ok, mal) => {
    const cliente = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: ALCANCE,
      callback: (r) => {
        if (r.error) { mal(new Error(r.error === 'access_denied' ? 'No diste permiso para usar tu calendario.' : `Google respondió: ${r.error}`)); return; }
        token = { valor: r.access_token, vence: Date.now() + (Number(r.expires_in) || 3600) * 1000 };
        ok(token.valor);
      },
      error_callback: (e) => mal(new Error(e?.type === 'popup_closed' ? 'Se cerró la ventana de Google antes de terminar.' : 'No se pudo abrir la ventana de Google. Revisa que el navegador permita ventanas emergentes.')),
    });
    cliente.requestAccessToken({ prompt: getGoogle().calendario ? '' : 'consent' });
  });
}

async function google(ruta, { method = 'GET', body } = {}) {
  const r = await fetch(`${API}${ruta}`, {
    method,
    headers: { Authorization: `Bearer ${token.valor}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.error?.message || `Google Calendar respondió ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return j;
}

async function asegurarCalendario() {
  const g = getGoogle();
  if (g.calendario) {
    try { await google(`/calendars/${encodeURIComponent(g.calendario)}`); return g.calendario; } catch (e) { if (e.status !== 404) throw e; }
  }
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const cal = await google('/calendars', { method: 'POST', body: { summary: `${NOMBRE} · sesiones`, timeZone: zona } });
  saveGoogle({ ...getGoogle(), calendario: cal.id });
  return cal.id;
}

/** Las sesiones que deben estar en el calendario: próximas cuatro semanas, sin "por preguntar" ni inactivas. */
export function sesionesParaCalendario(lista, ahora = new Date()) {
  const corte = new Date(ahora.getTime() - 60 * 60000);
  const limite = addDias(ahora, DIAS_A_SINCRONIZAR);
  const out = [];
  for (const c of lista) {
    if (c.activo === false || c.modo === 'preguntar') continue;
    for (const s of proximasSesiones(c, corte, 12)) {
      if (s > limite) break;
      out.push({ llave: `${c.id}|${fmtFechaHora(s)}`, alias: c.alias, inicio: s, fin: new Date(s.getTime() + DURACION_MIN * 60000) });
    }
  }
  return out;
}

/** Sincroniza: agrega las sesiones que faltan y quita las que ya no van. Devuelve cuántas puso y quitó. */
export async function sincronizar(lista, ahora = new Date()) {
  await pedirPermiso();
  const cal = encodeURIComponent(await asegurarCalendario());
  const desde = new Date(ahora.getTime() - 60 * 60000).toISOString();
  const hasta = addDias(ahora, DIAS_A_SINCRONIZAR + 1).toISOString();
  const existentes = [];
  let pagina = '';
  do {
    const r = await google(`/calendars/${cal}/events?singleEvents=true&maxResults=250&privateExtendedProperty=origen%3Daniima&timeMin=${encodeURIComponent(desde)}&timeMax=${encodeURIComponent(hasta)}${pagina ? `&pageToken=${pagina}` : ''}`);
    existentes.push(...(r.items || []));
    pagina = r.nextPageToken || '';
  } while (pagina);

  const deseadas = sesionesParaCalendario(lista, ahora);
  const porLlave = new Map(existentes.map((e) => [e.extendedProperties?.private?.llave, e]));
  const quiero = new Set(deseadas.map((d) => d.llave));
  let puestas = 0; let quitadas = 0;

  for (const d of deseadas) {
    if (porLlave.has(d.llave)) continue;
    await google(`/calendars/${cal}/events`, {
      method: 'POST',
      body: {
        summary: `Sesión · ${d.alias}`,
        description: `Agendado desde ${NOMBRE}.`,
        start: { dateTime: d.inicio.toISOString() },
        end: { dateTime: d.fin.toISOString() },
        extendedProperties: { private: { origen: 'aniima', llave: d.llave } },
        reminders: { useDefault: true },
      },
    });
    puestas += 1;
  }
  for (const e of existentes) {
    if (quiero.has(e.extendedProperties?.private?.llave)) continue;
    await google(`/calendars/${cal}/events/${encodeURIComponent(e.id)}`, { method: 'DELETE' });
    quitadas += 1;
  }
  const g = { ...getGoogle(), ultima: new Date().toISOString() };
  saveGoogle(g);
  return { puestas, quitadas, total: deseadas.length };
}

/** Olvida la conexión en este consultorio (el calendario en Google queda; se puede borrar desde Google). */
export function desconectar() {
  if (token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(token.valor, () => {});
  token = null;
  saveGoogle({});
}
