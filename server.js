// Servidor de la plantilla (Railway o tu computadora).
//  - Sirve la app ya construida (carpeta dist/).
//  - Conecta el Asistente con Cloudflare Workers AI. Las llaves de Cloudflare viven SOLO aquí,
//    en variables de entorno; el navegador nunca las ve.
//
// Variables:
//   CF_ACCOUNT_ID, CF_API_TOKEN   → Cloudflare (Workers AI). Sin ellas, el asistente queda apagado.
//   CF_MODELO (opcional)          → modelo de Workers AI para el asistente.
//   CF_MODELO_AUDIO (opcional)    → modelo para transcribir audio (Whisper).
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY → para comprobar que quien pregunta es un terapeuta autorizado.
//   IA_CLAVE_ACCESO (opcional)    → si NO usas Supabase, una clave que se pide para usar el asistente.
//   IA_DEMO=si (opcional)         → deja probar el asistente en la demostración ("Iniciar sin cuenta"), con límites.
//   IA_DEMO_DIARIO (opcional)     → máximo de preguntas al día de la demostración, entre todas las visitas (150 si no se pone).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('./dist/', import.meta.url));
const PUERTO = Number(process.env.PORT) || 3000;
const CF_CUENTA = process.env.CF_ACCOUNT_ID;
const CF_TOKEN = process.env.CF_API_TOKEN;
const CF_MODELO = process.env.CF_MODELO || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const CF_MODELO_AUDIO = process.env.CF_MODELO_AUDIO || '@cf/openai/whisper-large-v3-turbo';
const LIMITE_AUDIO = 25 * 1024 * 1024; // 25 MB por audio
const CF_BASE = process.env.CF_API_BASE || 'https://api.cloudflare.com/client/v4'; // solo se cambia para pruebas
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_LLAVE = process.env.VITE_SUPABASE_ANON_KEY;
const CLAVE_ACCESO = process.env.IA_CLAVE_ACCESO;
const IA_DEMO = process.env.IA_DEMO === 'si';
const DEMO_DIARIO = Number(process.env.IA_DEMO_DIARIO) || 150;

const iaConectada = () => !!(CF_CUENTA && CF_TOKEN);
const modoAcceso = () => (SB_URL && SB_LLAVE ? 'supabase' : CLAVE_ACCESO ? 'clave' : 'ninguno');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};
const CABECERAS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), geolocation=()',
};

const responder = (res, codigo, cuerpo) => {
  res.writeHead(codigo, { ...CABECERAS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(cuerpo));
};

// Límite sencillo: 30 preguntas por minuto por dirección
const visitas = new Map();
const demasiadas = (ip) => {
  const ahora = Date.now();
  const lista = (visitas.get(ip) || []).filter((t) => ahora - t < 60000);
  lista.push(ahora);
  visitas.set(ip, lista);
  return lista.length > 30;
};

const leerBytes = (req, limite) => new Promise((resolve, reject) => {
  const partes = [];
  let total = 0;
  req.on('data', (c) => { total += c.length; if (total > limite) { reject(new Error('demasiado')); req.destroy(); } else partes.push(c); });
  req.on('end', () => resolve(Buffer.concat(partes)));
  req.on('error', reject);
});
const leerCuerpo = async (req, limite = 300000) => (await leerBytes(req, limite)).toString('utf8');

async function autorizado(req) {
  const modo = modoAcceso();
  if (modo === 'supabase') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return false;
    try {
      const r = await fetch(`${SB_URL}/rest/v1/rpc/es_terapeuta`, {
        method: 'POST',
        headers: { apikey: SB_LLAVE, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      return r.ok && (await r.json()) === true;
    } catch (_) {
      return false;
    }
  }
  if (modo === 'clave') return req.headers['x-clave-asistente'] === CLAVE_ACCESO;
  return false;
}

async function asistente(req, res) {
  if (!iaConectada()) return responder(res, 503, { error: 'El asistente no está conectado: faltan las variables de Cloudflare en el servidor.' });
  if (modoAcceso() === 'ninguno') return responder(res, 503, { error: 'Falta proteger el asistente: conecta Supabase o define IA_CLAVE_ACCESO en el servidor.' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (demasiadas(ip)) return responder(res, 429, { error: 'Demasiadas preguntas seguidas. Espera un minuto.' });
  if (!(await autorizado(req))) {
    return responder(res, 401, { error: modoAcceso() === 'clave' ? 'La clave de acceso del asistente no es correcta.' : 'Inicia sesión con tu cuenta de terapeuta para usar el asistente.' });
  }

  let pedido;
  try { pedido = JSON.parse(await leerCuerpo(req)); } catch (_) { return responder(res, 400, { error: 'La pregunta es demasiado larga o no se pudo leer.' }); }
  const mensajes = (Array.isArray(pedido.mensajes) ? pedido.mensajes : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20000) }));
  if (!mensajes.length || mensajes[mensajes.length - 1].role !== 'user') return responder(res, 400, { error: 'Falta tu pregunta.' });
  const sistema = typeof pedido.sistema === 'string' ? pedido.sistema.slice(0, 60000) : '';
  return preguntarCloudflare(res, sistema, mensajes, 1500);
}

// Demostración ("Iniciar sin cuenta"): sin sesión, pero con límites para que nadie gaste tu cuenta de Cloudflare.
// Solo funciona si pones IA_DEMO=si. Los casos de la demo son inventados.
const demoPorIp = new Map();
let demoHoy = { dia: '', n: 0 };
async function asistenteDemo(req, res) {
  if (!iaConectada()) return responder(res, 503, { error: 'El asistente no está conectado: faltan las variables de Cloudflare en el servidor.' });
  if (!IA_DEMO) return responder(res, 403, { error: 'El asistente no está disponible en la demostración.' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const ahora = Date.now();
  const recientes = (demoPorIp.get(ip) || []).filter((t) => ahora - t < 3600000);
  if (recientes.length >= 20) return responder(res, 429, { error: 'Ya hiciste muchas preguntas en la demostración. Intenta en una hora.' });
  const dia = new Date().toISOString().slice(0, 10);
  if (demoHoy.dia !== dia) demoHoy = { dia, n: 0 };
  if (demoHoy.n >= DEMO_DIARIO) return responder(res, 429, { error: 'La demostración del asistente llegó a su límite de hoy. Intenta mañana.' });
  recientes.push(ahora);
  demoPorIp.set(ip, recientes);
  demoHoy.n += 1;

  let pedido;
  try { pedido = JSON.parse(await leerCuerpo(req, 60000)); } catch (_) { return responder(res, 400, { error: 'La pregunta es demasiado larga o no se pudo leer.' }); }
  const mensajes = (Array.isArray(pedido.mensajes) ? pedido.mensajes : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 3000) }));
  if (!mensajes.length || mensajes[mensajes.length - 1].role !== 'user') return responder(res, 400, { error: 'Falta tu pregunta.' });
  const sistema = typeof pedido.sistema === 'string' ? pedido.sistema.slice(0, 20000) : '';
  return preguntarCloudflare(res, sistema, mensajes, 900);
}

async function preguntarCloudflare(res, sistema, mensajes, maxTokens) {
  try {
    const r = await fetch(`${CF_BASE}/accounts/${CF_CUENTA}/ai/run/${CF_MODELO}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: sistema }, ...mensajes], max_tokens: maxTokens, temperature: 0.4 }),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok || datos.success === false) {
      const detalle = datos.errors?.[0]?.message || `código ${r.status}`;
      console.error('Cloudflare respondió con error:', detalle);
      return responder(res, 502, { error: `Cloudflare no pudo responder (${detalle}). Revisa tus llaves y el modelo.` });
    }
    const texto = datos.result?.response;
    return responder(res, 200, { respuesta: typeof texto === 'string' ? texto : JSON.stringify(texto ?? ''), modelo: CF_MODELO });
  } catch (e) {
    console.error('No se pudo contactar a Cloudflare:', e.message);
    return responder(res, 502, { error: 'No se pudo contactar a Cloudflare. Intenta de nuevo.' });
  }
}

// Recibe un audio (el cuerpo de la petición tal cual) y devuelve su transcripción en texto.
async function transcribir(req, res) {
  if (!iaConectada()) return responder(res, 503, { error: 'La transcripción no está conectada: faltan las variables de Cloudflare en el servidor.' });
  if (modoAcceso() === 'ninguno') return responder(res, 503, { error: 'Falta proteger el servidor: conecta Supabase o define IA_CLAVE_ACCESO.' });
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (demasiadas(ip)) return responder(res, 429, { error: 'Demasiadas peticiones seguidas. Espera un minuto.' });
  if (!(await autorizado(req))) return responder(res, 401, { error: 'Inicia sesión con tu cuenta de terapeuta para transcribir.' });
  let audio;
  try { audio = await leerBytes(req, LIMITE_AUDIO); } catch (_) { return responder(res, 413, { error: 'El audio pesa más de 25 MB. Divídelo en partes más cortas.' }); }
  if (!audio.length) return responder(res, 400, { error: 'No llegó ningún audio.' });
  try {
    const r = await fetch(`${CF_BASE}/accounts/${CF_CUENTA}/ai/run/${CF_MODELO_AUDIO}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audio.toString('base64'), language: 'es' }),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok || datos.success === false) {
      const detalle = datos.errors?.[0]?.message || `código ${r.status}`;
      console.error('Cloudflare no pudo transcribir:', detalle);
      return responder(res, 502, { error: `Cloudflare no pudo transcribir (${detalle}).` });
    }
    return responder(res, 200, { texto: (datos.result?.text || '').trim() });
  } catch (e) {
    console.error('No se pudo contactar a Cloudflare:', e.message);
    return responder(res, 502, { error: 'No se pudo contactar a Cloudflare. Intenta de nuevo.' });
  }
}

async function archivo(req, res) {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const pedida = normalize(join(DIST, ruta));
  const dentro = pedida.startsWith(DIST) || pedida + sep === DIST;
  const candidatos = dentro && extname(pedida) ? [pedida] : [];
  candidatos.push(join(DIST, 'index.html')); // rutas de la app
  for (const c of candidatos) {
    try {
      const contenido = await readFile(c);
      const esRecurso = c.includes(`${sep}assets${sep}`);
      res.writeHead(200, {
        ...CABECERAS,
        'Content-Type': TIPOS[extname(c)] || 'application/octet-stream',
        'Cache-Control': esRecurso ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
      return res.end(contenido);
    } catch (_) { /* siguiente candidato */ }
  }
  res.writeHead(404, CABECERAS);
  res.end('No encontrado');
}

const servidor = http.createServer((req, res) => {
  const ruta = new URL(req.url, 'http://x').pathname;
  if (ruta === '/api/ia/estado' && req.method === 'GET') {
    return responder(res, 200, { conectada: iaConectada(), modelo: iaConectada() ? CF_MODELO : null, acceso: modoAcceso(), demo: iaConectada() && IA_DEMO });
  }
  if (ruta === '/api/ia' && req.method === 'POST') return asistente(req, res);
  if (ruta === '/api/ia/demo' && req.method === 'POST') return asistenteDemo(req, res);
  if (ruta === '/api/transcribir' && req.method === 'POST') return transcribir(req, res);
  if (ruta.startsWith('/api/')) return responder(res, 404, { error: 'Ruta no encontrada.' });
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, CABECERAS); return res.end(); }
  return archivo(req, res);
});

servidor.listen(PUERTO, '0.0.0.0', () => {
  console.log(`Consultorio en el puerto ${PUERTO} · asistente ${iaConectada() ? `conectado (${CF_MODELO})` : 'sin conectar'} · acceso: ${modoAcceso()} · demo: ${IA_DEMO ? 'sí' : 'no'}`);
});
