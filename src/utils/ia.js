/**
 * ia.js
 * Habla con el asistente a través del servidor de la plantilla (server.js), que conecta con Cloudflare Workers AI.
 * El navegador nunca tiene las llaves de Cloudflare.
 */
import { nube, hayNube } from './nube';

/** ¿Hay servidor y está conectado a Cloudflare? */
export async function estadoIA() {
  try {
    const r = await fetch('/api/ia/estado', { cache: 'no-store' });
    const j = await r.json();
    return { servidor: true, ...j };
  } catch (_) {
    return { servidor: false, conectada: false, acceso: 'ninguno' };
  }
}

export async function preguntarIA({ sistema, mensajes, clave }) {
  const cabeceras = { 'Content-Type': 'application/json' };
  if (hayNube) {
    const { data } = await nube.auth.getSession();
    if (data.session) cabeceras.Authorization = `Bearer ${data.session.access_token}`;
  }
  if (clave) cabeceras['x-clave-asistente'] = clave;
  let r;
  try {
    r = await fetch('/api/ia', { method: 'POST', headers: cabeceras, body: JSON.stringify({ sistema, mensajes }) });
  } catch (_) {
    throw new Error('No se pudo conectar con el servidor del asistente.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'El asistente no respondió. Intenta de nuevo.');
  return j.respuesta || '';
}

/**
 * Quita del texto lo que identifica a una persona antes de mandarlo al asistente:
 * correos, teléfonos y los nombres que se indiquen (se cambian por el código).
 */
export function desidentificar(texto, reemplazos = []) {
  let t = texto || '';
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[correo]');
  t = t.replace(/(\+?\d[\d\s().-]{7,}\d)/g, '[teléfono]');
  for (const { nombre, codigo } of reemplazos) {
    const partes = (nombre || '').split(/\s+/).filter((p) => p.length >= 3 && !/^[A-Z]\.?$/.test(p));
    for (const p of [nombre, ...partes]) {
      if (!p || p.length < 3) continue;
      t = t.replace(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), codigo || '[consultante]');
    }
  }
  return t;
}

/** La clave de acceso que la terapeuta guardó en Directrices (solo se usa si no hay Supabase). */
export function claveGuardada() {
  try {
    const t = JSON.parse(localStorage.getItem('oasis_clinico_active_user') || 'null');
    const id = t?.id || 'demo-terapeuta-01';
    return JSON.parse(localStorage.getItem(`oasis_clinico_${id}_asistente_ajustes`) || '{}').clave || '';
  } catch (_) {
    return '';
  }
}

/** Manda un audio al servidor y regresa su transcripción. */
export async function transcribirAudio(archivo, clave = claveGuardada()) {
  if (archivo.size > 25 * 1024 * 1024) throw new Error('El audio pesa más de 25 MB. Divídelo en partes más cortas.');
  const cabeceras = { 'Content-Type': archivo.type || 'application/octet-stream' };
  if (hayNube) {
    const { data } = await nube.auth.getSession();
    if (data.session) cabeceras.Authorization = `Bearer ${data.session.access_token}`;
  }
  if (clave) cabeceras['x-clave-asistente'] = clave;
  let r;
  try {
    r = await fetch('/api/transcribir', { method: 'POST', headers: cabeceras, body: archivo });
  } catch (_) {
    throw new Error('No se pudo conectar con el servidor para transcribir.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo transcribir el audio.');
  return j.texto || '';
}
