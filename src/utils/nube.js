/**
 * nube.js
 * Conexión opcional con Supabase. Si la plantilla no tiene llaves (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY),
 * todo sigue funcionando en modo local, solo en este navegador.
 *
 * Con llaves:
 *  - El terapeuta inicia sesión y sus datos (expedientes, Mi lista, pagos…) se guardan en su base de datos.
 *    El navegador funciona como copia rápida: se lee de aquí y cada cambio se sube a Supabase.
 *  - Los consultantes crean su cuenta con su correo (o con Google) y llenan su entrevista.
 */
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const LLAVE = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const nube = URL && LLAVE ? createClient(URL, LLAVE) : null;
export const hayNube = !!nube;

// Los consultantes entran con nombre de usuario; Supabase necesita un correo, así que se arma uno interno
// que nunca recibe mensajes (por eso hay que apagar "Confirm email" en Supabase).
export const DOMINIO_USUARIOS = import.meta.env.VITE_DOMINIO_USUARIOS || 'consultantes.local';
export const correoDeUsuario = (usuario) => `${usuario}@${DOMINIO_USUARIOS}`;
/** Mensaje entendible para errores de red o de Supabase. */
export const mensajeError = (e) => (/Failed to fetch|NetworkError|Load failed/i.test(e?.message || '') ? 'No se pudo conectar con la base de datos. Revisa tu internet; si sigue igual, revisa la URL y la llave de Supabase.' : e?.message || 'Algo falló. Intenta de nuevo.');

export const limpiarUsuario = (txt) => (txt || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');

const PREFIJO = 'oasis_clinico_';
const esClaveDeDatos = (clave) => clave.startsWith(PREFIJO) && !clave.endsWith('active_user');

// ---------- Estado de guardado (para mostrarlo en pantalla) ----------
let estado = hayNube ? 'local' : 'sin-nube'; // 'sin-nube' | 'local' | 'guardando' | 'guardado' | 'error'
let detalleError = '';
const oyentes = new Set();
const avisar = (nuevo, detalle = '') => { estado = nuevo; detalleError = detalle; oyentes.forEach((f) => f(estado, detalleError)); };
export const estadoNube = () => ({ estado, detalleError });
export const escucharNube = (f) => { oyentes.add(f); return () => oyentes.delete(f); };

// ---------- Sincronización de los datos del terapeuta ----------
let sincronizando = false;
const pendientes = new Map();
let temporizador = null;

export const activarSincronizacion = (activa) => {
  sincronizando = activa && hayNube;
  avisar(sincronizando ? 'guardado' : hayNube ? 'local' : 'sin-nube');
};

/** Guarda en el navegador y, si hay sesión de terapeuta, lo sube a Supabase (agrupado, ~1 s después). */
export function guardarLocal(clave, texto) {
  try { localStorage.setItem(clave, texto); } catch (_) { /* sin almacenamiento */ }
  if (!sincronizando || !esClaveDeDatos(clave)) return;
  pendientes.set(clave, texto);
  clearTimeout(temporizador);
  avisar('guardando');
  temporizador = setTimeout(subirPendientes, 900);
}

async function subirPendientes() {
  if (!pendientes.size) return;
  const lote = [...pendientes];
  pendientes.clear();
  const filas = lote.map(([clave, texto]) => ({ clave, valor: JSON.parse(texto), actualizado: new Date().toISOString() }));
  const { error } = await nube.from('datos_terapeuta').upsert(filas, { onConflict: 'dueno,clave' });
  if (error) {
    // Se quedan en la fila para el siguiente intento
    lote.forEach(([clave, texto]) => { if (!pendientes.has(clave)) pendientes.set(clave, texto); });
    avisar('error', error.message);
    clearTimeout(temporizador);
    temporizador = setTimeout(subirPendientes, 15000);
    return;
  }
  avisar(pendientes.size ? 'guardando' : 'guardado');
}

/** Trae de Supabase todo lo del terapeuta al navegador. Si su base está vacía, sube lo que ya tenía aquí. */
export async function bajarDatos(userId) {
  const { data, error } = await nube.from('datos_terapeuta').select('clave, valor');
  if (error) throw new Error(error.message);
  if (data.length) {
    data.forEach(({ clave, valor }) => { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (_) { /* */ } });
    return;
  }
  const propias = Object.keys(localStorage).filter((k) => k.startsWith(`${PREFIJO}${userId}_`));
  propias.forEach((k) => guardarLocal(k, localStorage.getItem(k)));
}

/** Borra del navegador la copia de los datos de una cuenta (al cerrar sesión, ya están en Supabase). */
export function borrarCopiaLocal(userId) {
  Object.keys(localStorage).filter((k) => k.startsWith(`${PREFIJO}${userId}_`)).forEach((k) => localStorage.removeItem(k));
}

// ---------- Cuenta del terapeuta ----------

export const terapeutaDesdeUsuario = (u) => ({
  id: u.id,
  email: u.email,
  nombre: u.user_metadata?.nombre || u.email,
  cedula: u.user_metadata?.cedula || '',
  enfoque: u.user_metadata?.enfoque || '',
  isDemo: false,
  nube: true,
});

async function confirmarTerapeuta() {
  const { data, error } = await nube.rpc('es_terapeuta');
  if (error) throw new Error(`No se pudo revisar tu cuenta: ${mensajeError(error)} ¿Ya pegaste el esquema en Supabase?`);
  if (!data) {
    await nube.auth.signOut();
    throw new Error('Esta cuenta no es la dueña del consultorio. Si es la tuya, corre en Supabase la línea del paso 8 de la guía con tu correo y vuelve a entrar.');
  }
}

/** Abre el candado del consultorio. La cuenta de la dueña se crea una vez en Supabase (ver guía). */
export async function entrarTerapeuta({ email, password }) {
  const { error } = await nube.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : mensajeError(error));
  await confirmarTerapeuta();
  const { data } = await nube.auth.getUser();
  return data.user;
}

/** Si ya había una sesión abierta de terapeuta, la recupera al cargar la página. */
export async function sesionTerapeuta() {
  if (!nube) return null;
  const { data } = await nube.auth.getSession();
  const u = data.session?.user;
  if (!u || u.email?.endsWith(`@${DOMINIO_USUARIOS}`)) return null;
  const { data: es } = await nube.rpc('es_terapeuta');
  return es ? u : null;
}

export async function salirNube() {
  clearTimeout(temporizador);
  await subirPendientes();
  activarSincronizacion(false);
  if (nube) await nube.auth.signOut();
}
