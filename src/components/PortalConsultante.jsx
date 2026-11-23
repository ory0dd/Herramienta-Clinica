import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ChevronLeft, Check, LogOut, ShieldCheck, ChevronRight, FileSignature, ClipboardList,
  Mic, Square, RotateCcw, PenLine, Mail,
} from 'lucide-react';
import { ConstanciaConsentimiento, BotonImprimir, AudioConsentimiento } from '../app/Documento';
import { nube, hayNube, correoDeUsuario, limpiarUsuario, DOMINIO_USUARIOS, mensajeError } from '../utils/nube';
import { SECCIONES_ENTREVISTA as SECCIONES, PREGUNTAS_ENTREVISTA, MENSAJE_CRISIS } from '../data/entrevista';
import { CONSENTIMIENTO, VERSION_CONSENTIMIENTO } from '../data/consentimiento';
import { animar, vt } from '../app/rutas';
import { volverAlInicio, recordarModo } from '../app/modo';

const inp = 'w-full h-12 rounded-xl bg-raised border border-line focus:border-emerald-400/60 outline-none px-3.5 text-[15px] text-ink placeholder:text-zinc-600 transition-colors';
const area = 'w-full rounded-xl bg-raised border border-line focus:border-emerald-400/60 outline-none p-3 text-[15px] leading-relaxed text-ink placeholder:text-zinc-600 resize-y';
const btnPri = 'h-12 px-5 rounded-full text-[15px] font-semibold bg-emerald-400 hover:bg-emerald-300 text-emerald-950 disabled:opacity-40 flex items-center justify-center gap-2 transition active:scale-[.98]';
const btnSec = 'h-11 px-4 rounded-full text-sm text-zinc-400 hover:text-ink flex items-center gap-2 transition-colors';
const etiqueta = 'block space-y-1.5 text-[13px] text-zinc-400';

// Acceso con Google: se muestra cuando el consultorio lo activó (VITE_ACCESO_GOOGLE=si) y en la vista previa
const CON_GOOGLE = import.meta.env.VITE_ACCESO_GOOGLE === 'si';

const fechaLarga = (d = new Date()) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

function Marco({ children, atras = false }) {
  return (
    <div className="min-h-screen bg-base text-ink flex flex-col items-center px-4 py-8 sm:py-14">
      <div style={vt('contenido')} className="w-full max-w-xl space-y-6">
        {atras && (
          <button type="button" onClick={volverAlInicio} className="-ml-2 -mb-2 h-9 pl-1 pr-3 rounded-lg inline-flex items-center gap-1 text-[14px] text-zinc-400 hover:text-ink transition-colors">
            <ChevronLeft size={18} /> Inicio
          </button>
        )}
        {children}
      </div>
      <p className="mt-12 text-[11.5px] text-zinc-600 text-center max-w-sm">
        Tus respuestas solo las ve tu terapeuta. Esta plataforma no es un servicio de urgencias.
      </p>
    </div>
  );
}

function Encabezado({ paso, onSalir }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.09em] text-zinc-500"><ShieldCheck size={14} className="text-emerald-300" /> Espacio privado</p>
        <h1 className="font-display text-[34px] xs:text-[42px] leading-[1.02] text-ink mt-1">{paso}</h1>
      </div>
      {onSalir && <button type="button" onClick={onSalir} className={`${btnSec} shrink-0`}><LogOut size={16} /> Salir</button>}
    </div>
  );
}

/** Los tres pasos del consultante: cuenta, consentimiento y entrevista. */
function Pasos({ actual }) {
  const pasos = ['Cuenta', 'Consentimiento', 'Entrevista'];
  return (
    <ol className="flex items-center gap-2 text-[12.5px]" aria-label="Pasos">
      {pasos.map((p, i) => (
        <li key={p} className="flex items-center gap-2" aria-current={i === actual ? 'step' : undefined}>
          <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center text-[11.5px] tabular transition-colors ${i < actual ? 'bg-emerald-400 text-emerald-950' : i === actual ? 'ring-1 ring-emerald-400/70 text-emerald-200 bg-emerald-400/10' : 'ring-1 ring-line text-zinc-600'}`}>
            {i < actual ? <Check size={13} /> : i + 1}
          </span>
          <span className={i === actual ? 'text-ink' : 'hidden sm:inline text-zinc-500'}>{p}</span>
          {i < pasos.length - 1 && <span className="w-4 xs:w-6 h-px bg-line" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

const traducirError = (error) => {
  const m = error?.message || '';
  if (/row-level security/i.test(m) || error?.code === '42501') return 'El código de invitación no es correcto. Pídeselo a tu terapeuta.';
  if (/already registered|already been registered/i.test(m)) return 'Ese correo ya tiene cuenta. Entra con “Ya tengo cuenta”.';
  if (/duplicate key/i.test(m) || error?.code === '23505') return 'Ese nombre de usuario ya está ocupado. Prueba con otro.';
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/provider is not enabled|Unsupported provider/i.test(m)) return 'Tu terapeuta aún no activa el acceso con Google. Usa tu correo.';
  if (/valid email|invalid format/i.test(m)) return 'Revisa que tu correo esté bien escrito.';
  return mensajeError(error);
};

// Nombre de usuario interno a partir del correo (los de antes, sin correo, ya lo traen)
const usuarioDe = (correo = '') => {
  const [local, dominio] = correo.split('@');
  if (dominio === DOMINIO_USUARIOS) return local;
  return `${(limpiarUsuario(local) || 'consultante').slice(0, 16)}-${Math.random().toString(36).slice(2, 6)}`;
};

/** Grabadora para confirmar el consentimiento con la voz. Guarda el audio solo en memoria hasta firmar. */
function Grabadora({ audio, onAudio, frase }) {
  const [grabando, setGrabando] = useState(false);
  const [seg, setSeg] = useState(0);
  const [error, setError] = useState('');
  const rec = useRef(null);
  const reloj = useRef(null);

  const parar = () => { if (rec.current?.state === 'recording') rec.current.stop(); };
  useEffect(() => { if (seg >= 60) parar(); }, [seg]);
  useEffect(() => () => { clearInterval(reloj.current); parar(); }, []);

  const empezar = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Este navegador no deja grabar audio. Usa la firma escrita.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
      const r = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      const partes = [];
      r.ondataavailable = (e) => { if (e.data.size) partes.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(reloj.current);
        setGrabando(false);
        const blob = new Blob(partes, { type: r.mimeType || tipo || 'audio/webm' });
        if (blob.size) onAudio({ blob, url: URL.createObjectURL(blob), tipo: blob.type });
      };
      r.start();
      rec.current = r;
      setSeg(0);
      setGrabando(true);
      reloj.current = setInterval(() => setSeg((x) => x + 1), 1000);
    } catch (_) {
      setError('No se pudo usar el micrófono. Revisa el permiso del navegador o usa la firma escrita.');
    }
  };

  return (
    <div className="space-y-4">
      <blockquote className="rounded-2xl bg-raised/60 ring-1 ring-line px-4 py-3.5 text-[15px] leading-relaxed text-zinc-200">
        <span className="block text-[11.5px] uppercase tracking-[0.09em] text-zinc-500 mb-1">Lee en voz alta</span>
        “{frase}”
      </blockquote>
      {audio && !grabando ? (
        <div className="space-y-3 animate-entrada">
          <audio controls src={audio.url} className="w-full h-10" />
          <button type="button" onClick={() => { onAudio(null); empezar(); }} className={btnSec}><RotateCcw size={15} /> Grabar de nuevo</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <button type="button" onClick={grabando ? parar : empezar} aria-label={grabando ? 'Detener grabación' : 'Empezar a grabar'}
            className={`relative w-20 h-20 rounded-full grid place-items-center transition active:scale-95 ${grabando ? 'bg-rose-400 text-rose-950' : 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300'}`}>
            {grabando && <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" aria-hidden="true" />}
            {grabando ? <Square size={24} className="relative" fill="currentColor" /> : <Mic size={28} />}
          </button>
          <p className="text-[13.5px] text-zinc-400 tabular">{grabando ? `Grabando · 0:${String(seg).padStart(2, '0')}` : 'Toca para grabar'}</p>
        </div>
      )}
      {error && <p className="text-[13px] text-rose-300">{error}</p>}
    </div>
  );
}

/** La respuesta de una pregunta, en grande (una pregunta por pantalla, como una plática). */
function Respuesta({ p, valor, onCambio, onListo }) {
  const id = `pc-${p.id}`;
  const marcada = (v) => valor !== undefined && valor !== null && valor !== '' && String(valor) === String(v);
  return (
    <div className="space-y-3">
      {p.tipo === 'corto' && (
        <input id={id} autoFocus value={valor || ''} onChange={(e) => onCambio(e.target.value)} aria-label={p.titulo}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onListo(); } }}
          placeholder={p.placeholder} className={`${inp} !h-14 !text-[17px] !rounded-2xl !px-4`} />
      )}
      {p.tipo === 'largo' && (
        <textarea id={id} autoFocus value={valor || ''} onChange={(e) => onCambio(e.target.value)} aria-label={p.titulo}
          placeholder={p.placeholder} className={`${area} min-h-[190px] !text-[16px] !rounded-2xl !p-4 resize-none`} />
      )}
      {p.tipo === 'opciones' && (
        <div className="grid gap-2" role="radiogroup" aria-label={p.titulo}>
          {p.opciones.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={marcada(o)} onClick={() => onCambio(o)}
              className={`w-full min-h-[52px] px-4 py-3 rounded-2xl text-[15.5px] text-left flex items-center justify-between gap-3 transition active:scale-[.99] ${marcada(o) ? 'bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-400/60' : 'bg-surface ring-1 ring-line text-zinc-300 hover:text-ink hover:ring-zinc-700'}`}>
              {o}
              <span className={`w-5 h-5 shrink-0 rounded-full grid place-items-center ${marcada(o) ? 'bg-emerald-400 text-emerald-950' : 'ring-1 ring-zinc-700'}`}>{marcada(o) && <Check size={12} strokeWidth={3} />}</span>
            </button>
          ))}
        </div>
      )}
      {p.tipo === 'escala' && (
        <div>
          <div className="grid grid-cols-6 xs:grid-cols-11 gap-1.5" role="radiogroup" aria-label={p.titulo}>
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} type="button" role="radio" aria-checked={marcada(n)} aria-label={String(n)} onClick={() => onCambio(n)}
                className={`h-12 rounded-xl text-[15px] tabular transition active:scale-95 ${marcada(n) ? 'bg-emerald-400 text-emerald-950 font-semibold' : 'bg-surface ring-1 ring-line text-zinc-400 hover:text-ink'}`}>{n}</button>
            ))}
          </div>
          <div className="flex justify-between text-[12.5px] text-zinc-500 mt-2"><span>0 · {p.minimo}</span><span>10 · {p.maximo}</span></div>
        </div>
      )}
      {p.riesgo && valor && valor !== 'No' && (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[14px] leading-relaxed text-amber-100">{MENSAJE_CRISIS}</p>
      )}
    </div>
  );
}

export default function PortalConsultante() {
  const [sesion, setSesion] = useState(undefined);       // undefined: cargando · null: sin sesión
  const [esTerapeuta, setEsTerapeuta] = useState(undefined);
  const [registro, setRegistro] = useState(undefined);   // undefined: cargando · null: le falta registrarse
  const [consentimiento, setConsentimiento] = useState(undefined);
  const [modo, setModo] = useState('crear');
  const [f, setF] = useState({ correo: '', password: '', alias: '', codigo: '' });
  const [firma, setFirma] = useState({ nombre: '', acepto: false, metodo: 'escrito', audio: null });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resp, setResp] = useState({});
  const [paso, setPaso] = useState(0);         // pregunta actual de la entrevista
  const [intro, setIntro] = useState(false);   // pantalla de bienvenida antes de la primera pregunta
  const [completada, setCompletada] = useState(false);
  const [vista, setVista] = useState('inicio'); // inicio | entrevista | consentimiento
  const [recienEnviada, setRecienEnviada] = useState(false);
  const [guardado, setGuardado] = useState('');
  const [demo, setDemo] = useState(false); // recorrido de ejemplo sin base de datos; no guarda nada
  const ultimaLectura = useRef(0);
  const arriba = useRef(null);

  useEffect(() => {
    if (!nube) return undefined;
    nube.auth.getSession().then(({ data }) => setSesion(data.session?.user || null));
    const { data } = nube.auth.onAuthStateChange((_e, s) => setSesion(s?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  // Una sesión es de consultante si no es la de la terapeuta (los consultantes pueden entrar con cualquier correo o con Google)
  useEffect(() => {
    setEsTerapeuta(undefined);
    if (!sesion) return;
    if (sesion.email?.endsWith(`@${DOMINIO_USUARIOS}`)) { setEsTerapeuta(false); return; }
    nube.rpc('es_terapeuta').then(({ data }) => setEsTerapeuta(!!data), () => setEsTerapeuta(false));
  }, [sesion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const esConsultante = !!sesion && esTerapeuta === false;

  // Solo cuenta la lectura más reciente (al crear la cuenta pueden cruzarse dos)
  const cargarRegistro = async (u) => {
    const n = ++ultimaLectura.current;
    const [c, k, e] = await Promise.all([
      nube.from('consultantes').select('usuario, alias').eq('id', u.id).maybeSingle(),
      nube.from('consentimientos').select('version, nombre_firma, aceptado_en, metodo, audio').eq('consultante', u.id).maybeSingle(),
      nube.from('entrevistas').select('respuestas, completada').eq('consultante', u.id).maybeSingle(),
    ]);
    if (n !== ultimaLectura.current) return;
    setRegistro(c.data || null);
    setConsentimiento(k.data || null);
    if (e.data) {
      setResp(e.data.respuestas || {});
      setCompletada(!!e.data.completada);
    }
  };

  useEffect(() => {
    if (esConsultante) {
      cargarRegistro(sesion);
      const nombre = sesion.user_metadata?.full_name || sesion.user_metadata?.name || '';
      if (nombre) setF((x) => ({ ...x, alias: x.alias || nombre.split(' ')[0] }));
    } else { setRegistro(undefined); setConsentimiento(undefined); }
  }, [sesion?.id, esConsultante]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { arriba.current?.scrollIntoView({ block: 'start' }); }, [paso, intro, consentimiento, vista]);

  const registrar = async (correo) => {
    const { error: e } = await nube.from('consultantes').insert({ usuario: usuarioDe(correo), alias: f.alias.trim(), codigo: f.codigo.trim() });
    if (e) throw e;
    await cargarRegistro((await nube.auth.getUser()).data.user);
  };

  const empezarDemo = (alias) => { setDemo(true); setRegistro({ alias: alias || 'nube_lenta' }); setConsentimiento(null); };

  const conGoogle = async () => {
    setError('');
    if (!hayNube) { empezarDemo(); return; }
    recordarModo('consultante'); // al regresar de Google, que abra este lado
    const { error: e } = await nube.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
    if (e) setError(traducirError(e));
  };

  const enviarAcceso = async (e) => {
    e.preventDefault();
    setError('');
    const dato = f.correo.trim().toLowerCase();
    // Las cuentas de antes entran con nombre de usuario; las nuevas, con correo
    const correo = modo === 'entrar' && !dato.includes('@') ? correoDeUsuario(limpiarUsuario(dato)) : dato;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return setError(modo === 'crear' ? 'Escribe tu correo electrónico.' : 'Escribe tu correo (o tu usuario).');
    if (f.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (modo === 'crear') {
      if (f.alias.trim().length < 2) return setError('Escribe cómo quieres que te digan.');
      if (f.codigo.trim().length < 4) return setError('Escribe el código de invitación que te dio tu terapeuta.');
    }
    if (!hayNube) { empezarDemo(f.alias.trim()); return undefined; }
    setCargando(true);
    try {
      if (modo === 'crear') {
        const { data, error: e1 } = await nube.auth.signUp({ email: correo, password: f.password });
        if (e1) throw e1;
        if (!data.session) throw new Error('Falta un ajuste en el consultorio: tu terapeuta debe apagar “Confirm email” en Supabase.');
        await registrar(correo);
      } else {
        const { error: e2 } = await nube.auth.signInWithPassword({ email: correo, password: f.password });
        if (e2) throw e2;
      }
    } catch (err) {
      setError(traducirError(err));
    } finally {
      setCargando(false);
    }
    return undefined;
  };

  const completarRegistro = async (e) => {
    e.preventDefault();
    setError('');
    if (f.alias.trim().length < 2) return setError('Escribe cómo quieres que te digan.');
    if (f.codigo.trim().length < 4) return setError('Escribe el código de invitación que te dio tu terapeuta.');
    setCargando(true);
    try { await registrar(sesion.email || ''); } catch (err) { setError(traducirError(err)); } finally { setCargando(false); }
    return undefined;
  };

  const firmar = async (e) => {
    e.preventDefault();
    setError('');
    if (firma.nombre.trim().length < 3) return setError('Escribe tu nombre completo.');
    if (firma.metodo === 'audio' && !firma.audio) return setError('Graba tu audio de consentimiento o cambia a firma escrita.');
    if (!firma.acepto) return setError('Marca la casilla para confirmar que leíste y aceptas.');
    const registroFirma = { version: VERSION_CONSENTIMIENTO, nombre_firma: firma.nombre.trim(), puntos: CONSENTIMIENTO.puntos.map((p) => p.id), metodo: firma.metodo };
    // Al firmar, pasa directo a la entrevista
    const continuar = (extra = {}) => animar(() => {
      setConsentimiento({ ...registroFirma, ...extra, aceptado_en: new Date().toISOString() });
      setPaso(0);
      setIntro(true);
      setVista('entrevista');
    }, 'adelante', true);
    if (demo) { continuar(firma.metodo === 'audio' ? { audioUrl: firma.audio.url } : {}); return undefined; }
    setCargando(true);
    let audio = null;
    if (firma.metodo === 'audio') {
      const ext = (firma.audio.tipo.split('/')[1] || 'webm').split(';')[0];
      audio = `${sesion.id}/consentimiento-${Date.now()}.${ext}`;
      const { error: eA } = await nube.storage.from('consentimientos').upload(audio, firma.audio.blob, { contentType: firma.audio.tipo });
      if (eA) { setCargando(false); return setError(`No se pudo subir tu audio: ${traducirError(eA)}`); }
    }
    const { error: e1 } = await nube.from('consentimientos').insert({ consultante: sesion.id, ...registroFirma, audio });
    setCargando(false);
    if (e1) return setError(traducirError(e1));
    continuar({ audio, audioUrl: firma.audio?.url });
    return undefined;
  };

  const guardar = async (respuestas, terminar = false) => {
    if (demo) { setGuardado('guardado'); if (terminar) setCompletada(true); return true; }
    setGuardado('guardando');
    const { error: e } = await nube.from('entrevistas').upsert(
      { consultante: sesion.id, respuestas, completada: terminar || completada, actualizada: new Date().toISOString() },
      { onConflict: 'consultante' }
    );
    setGuardado(e ? 'error' : 'guardado');
    if (!e && terminar) setCompletada(true);
    return !e;
  };

  const salir = async () => {
    if (demo) { setDemo(false); }
    else await nube.auth.signOut();
    setResp({}); setPaso(0); setIntro(false); setCompletada(false); setVista('inicio'); setRecienEnviada(false); setConsentimiento(undefined);
    setF({ correo: '', password: '', alias: '', codigo: '' }); setFirma({ nombre: '', acepto: false, metodo: 'escrito', audio: null });
  };

  // ---------- Pantallas ----------
  const cajaError = error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13.5px] text-rose-200 animate-entrada">{error}</p>;
  const avisoDemo = demo && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-200">Vista previa: así lo verá tu consultante. Nada se guarda.</p>;

  const cargandoPantalla = <Marco><p className="text-sm text-zinc-500 animate-pulse">Cargando…</p></Marco>;
  if (hayNube && !demo && (sesion === undefined || (sesion && esTerapeuta === undefined))) return cargandoPantalla;

  if (!demo && sesion && esTerapeuta) {
    return (
      <Marco atras>
        <Encabezado paso="Bienvenida" />
        <p className="text-[15px] text-zinc-400">Tienes abierta la sesión del lado clínico en este navegador. Este acceso es para tus consultantes: ábrelo en otro navegador o cierra tu sesión para probarlo.</p>
        <button type="button" onClick={salir} className={btnSec}><LogOut size={16} /> Cerrar sesión</button>
      </Marco>
    );
  }

  // Paso 0: cuenta (con Google o con correo)
  if (!demo && !sesion) {
    const crear = modo === 'crear';
    return (
      <Marco atras>
        <Pasos actual={0} />
        <Encabezado paso={crear ? 'Crea tu cuenta' : 'Entra a tu espacio'} />
        {!hayNube && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-200">Vista previa: este consultorio aún no conecta su base de datos. Puedes recorrerlo; nada se guarda.</p>}
        <p className="text-[15px] text-zinc-400 leading-relaxed -mt-2">{crear ? 'Después leerás el consentimiento informado y llenarás tu entrevista inicial.' : 'Retoma tu entrevista donde la dejaste.'}</p>

        {(CON_GOOGLE || !hayNube) && (
          <>
            <button type="button" onClick={conGoogle} className="w-full h-12 rounded-full bg-[#fff] text-[#18181b] ring-1 ring-black/10 text-[15px] font-medium flex items-center justify-center gap-3 transition active:scale-[.98] hover:bg-[#f4f4f5]">
              <LogoGoogle /> Continuar con Google
            </button>
            <div className="flex items-center gap-3 text-[12px] text-zinc-600"><span className="flex-1 h-px bg-line" />o con tu correo<span className="flex-1 h-px bg-line" /></div>
          </>
        )}

        <form onSubmit={enviarAcceso} className="space-y-4">
          <label className={etiqueta} htmlFor="pc-correo">{crear ? 'Correo electrónico' : 'Correo (o tu usuario)'}
            <input id="pc-correo" type={crear ? 'email' : 'text'} inputMode="email" autoComplete="email" autoCapitalize="none" value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} placeholder="tucorreo@ejemplo.com" className={inp} />
          </label>
          <label className={etiqueta} htmlFor="pc-pass">Contraseña
            <input id="pc-pass" type="password" autoComplete={crear ? 'new-password' : 'current-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Mínimo 6 caracteres" className={inp} />
          </label>
          {crear && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={etiqueta} htmlFor="pc-alias">¿Cómo quieres que te digan?
                <input id="pc-alias" value={f.alias} onChange={(e) => setF({ ...f, alias: e.target.value })} placeholder="Tu nombre o un alias" className={inp} />
              </label>
              <label className={etiqueta} htmlFor="pc-codigo">Código de invitación
                <input id="pc-codigo" autoCapitalize="characters" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} placeholder="Te lo da tu terapeuta" className={inp} />
              </label>
            </div>
          )}
          {cajaError}
          <button type="submit" disabled={cargando} className={`${btnPri} w-full`}>
            <Mail size={17} /> {cargando ? 'Un momento…' : crear ? 'Crear mi cuenta' : 'Entrar'}
          </button>
        </form>
        <button type="button" onClick={() => { setModo(crear ? 'entrar' : 'crear'); setError(''); }} className="w-full text-center text-[14px] text-zinc-400 hover:text-ink">
          {crear ? <>¿Ya tienes cuenta? <span className="text-emerald-300">Entra</span></> : <>¿Primera vez? <span className="text-emerald-300">Crea tu cuenta</span></>}
        </button>
        {hayNube && (
          <button type="button" onClick={() => empezarDemo()} className="w-full h-11 rounded-full text-[14px] text-zinc-300 ring-1 ring-line hover:text-ink hover:ring-zinc-700 transition active:scale-[.98]">
            Iniciar sin cuenta
          </button>
        )}
      </Marco>
    );
  }

  if (!demo && registro === undefined) return cargandoPantalla;

  if (!demo && registro === null) {
    return (
      <Marco>
        <Pasos actual={0} />
        <Encabezado paso="Casi listo" onSalir={salir} />
        <p className="text-[15px] text-zinc-400 -mt-2">Solo falta conectarte con tu terapeuta.</p>
        <form onSubmit={completarRegistro} className="space-y-4">
          <label className={etiqueta} htmlFor="pc-alias2">¿Cómo quieres que te digan?
            <input id="pc-alias2" value={f.alias} onChange={(e) => setF({ ...f, alias: e.target.value })} className={inp} />
          </label>
          <label className={etiqueta} htmlFor="pc-codigo2">Código de invitación
            <input id="pc-codigo2" autoCapitalize="characters" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} placeholder="Te lo da tu terapeuta" className={inp} />
          </label>
          {cajaError}
          <button type="submit" disabled={cargando} className={`${btnPri} w-full`}>{cargando ? 'Un momento…' : 'Continuar'} <ArrowRight size={17} /></button>
        </form>
      </Marco>
    );
  }

  // Paso 1: consentimiento informado
  if (!consentimiento) {
    const frase = `Yo, ${firma.nombre.trim() || 'mi nombre completo'}, leí el consentimiento informado y acepto iniciar el proceso.`;
    return (
      <Marco>
        <div ref={arriba} />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Pasos actual={1} />
          <button type="button" onClick={salir} className={`${btnSec} !h-9 !px-2`}><LogOut size={16} /> Salir</button>
        </div>
        <Encabezado paso={CONSENTIMIENTO.titulo} />
        {avisoDemo}
        <p className="text-[15.5px] text-zinc-300 leading-relaxed">Hola, <span className="text-ink">{registro.alias}</span>. {CONSENTIMIENTO.introduccion}</p>

        <ol className="space-y-3">
          {CONSENTIMIENTO.puntos.map((p, i) => (
            <li key={p.id} className="rounded-2xl bg-surface ring-1 ring-line p-4 flex gap-3.5">
              <span className="w-7 h-7 shrink-0 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30 grid place-items-center text-[12px] text-emerald-200 tabular">{i + 1}</span>
              <div className="min-w-0">
                <h2 className="text-[15.5px] font-medium text-ink leading-snug">{p.titulo}</h2>
                <p className="text-[14px] leading-relaxed text-zinc-400 mt-1.5">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        <form onSubmit={firmar} className="rounded-3xl bg-surface ring-1 ring-emerald-400/20 p-5 space-y-5">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Confirma tu consentimiento</h2>
            <p className="text-[13.5px] text-zinc-400 mt-1 leading-relaxed">{CONSENTIMIENTO.firma}</p>
          </div>
          <label className={etiqueta} htmlFor="pc-firma">Tu nombre completo
            <input id="pc-firma" autoComplete="name" value={firma.nombre} onChange={(e) => setFirma({ ...firma, nombre: e.target.value })} className={inp} />
          </label>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-base ring-1 ring-line" role="radiogroup" aria-label="Cómo confirmas">
            {[['escrito', 'Firma escrita', PenLine], ['audio', 'Con mi voz', Mic]].map(([id, label, I]) => (
              <button key={id} type="button" role="radio" aria-checked={firma.metodo === id} onClick={() => { setFirma({ ...firma, metodo: id }); setError(''); }}
                className={`h-10 rounded-lg text-[14px] inline-flex items-center justify-center gap-2 transition-colors ${firma.metodo === id ? 'bg-raised text-ink ring-1 ring-line' : 'text-zinc-500 hover:text-ink'}`}>
                <I size={15} /> {label}
              </button>
            ))}
          </div>

          {firma.metodo === 'escrito' ? (
            <div className="rounded-2xl bg-[#f7f6f3] text-[#1d1d1f] px-5 pt-6 pb-4 animate-entrada">
              <p className="font-display text-[30px] leading-none min-h-[30px] truncate">{firma.nombre.trim() || <span className="text-black/25">Tu firma</span>}</p>
              <div className="border-t border-black/25 mt-3 pt-1.5 flex justify-between text-[11.5px] text-black/50"><span>Firma</span><span>{fechaLarga()}</span></div>
            </div>
          ) : (
            <Grabadora frase={frase} audio={firma.audio} onAudio={(a) => setFirma((x) => ({ ...x, audio: a }))} />
          )}

          <label className="flex items-start gap-3 text-[14px] text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={firma.acepto} onChange={(e) => setFirma({ ...firma, acepto: e.target.checked })} className="mt-0.5 accent-emerald-400 w-5 h-5 shrink-0" />
            Leí el consentimiento informado y acepto iniciar el proceso.
          </label>
          <p className="text-[12px] text-zinc-500">{fechaLarga()} · Versión {VERSION_CONSENTIMIENTO}</p>
          {cajaError}
          <button type="submit" disabled={cargando} className={`${btnPri} w-full`}>{cargando ? 'Un momento…' : 'Aceptar y empezar mi entrevista'} <ArrowRight size={17} /></button>
        </form>
      </Marco>
    );
  }

  // ---------- Mi espacio (después de firmar) ----------
  const total = PREGUNTAS_ENTREVISTA.length;
  const respondida = (p) => String(resp[p.id] ?? '').trim() !== '';
  const hechas = PREGUNTAS_ENTREVISTA.filter(respondida).length;
  const ir = (v, direccion = 'adelante') => animar(() => setVista(v), direccion, true);
  // Abre la entrevista en la primera pregunta de una sección (o en la bienvenida si aún no responde nada)
  const inicioDe = (i) => SECCIONES.slice(0, i).reduce((n, x) => n + x.preguntas.length, 0);
  const abrirSeccion = (i) => animar(() => { setPaso(inicioDe(i)); setIntro(hechas === 0 && i === 0); setVista('entrevista'); setRecienEnviada(false); }, 'adelante', true);
  const volverAlEspacio = (
    <button type="button" onClick={() => { guardar(resp); ir('inicio', 'atras'); }} className="-ml-2 h-9 pl-1 pr-3 rounded-lg inline-flex items-center gap-1 text-[14px] text-zinc-400 hover:text-ink">
      <ArrowLeft size={17} /> Mi espacio
    </button>
  );

  if (vista === 'consentimiento') {
    return (
      <Marco>
        <div ref={arriba} />
        {volverAlEspacio}
        <Encabezado paso="Tu consentimiento" onSalir={salir} />
        {avisoDemo}
        <AudioConsentimiento consentimiento={consentimiento} />
        <ConstanciaConsentimiento alias={registro.alias} consentimiento={consentimiento} />
        <BotonImprimir />
      </Marco>
    );
  }

  if (vista === 'entrevista') {
    const estadoGuardado = guardado === 'guardando' ? 'Guardando…' : guardado === 'error' ? 'No se pudo guardar; revisa tu internet' : guardado === 'guardado' ? 'Guardado' : '';

    // Bienvenida, antes de la primera pregunta
    if (intro) {
      return (
        <Marco>
          <div ref={arriba} />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">{volverAlEspacio}<Pasos actual={2} /></div>
          {avisoDemo}
          <section style={vt('paso')} className="min-h-[55vh] flex flex-col justify-center gap-6">
            <div className="space-y-3">
              <p className="text-[12px] uppercase tracking-[0.09em] text-emerald-300/80">Entrevista inicial</p>
              <h1 className="font-display text-[38px] xs:text-[46px] leading-[1.02] text-ink">Cuéntame un poco de ti</h1>
              <p className="text-[15.5px] text-zinc-400 leading-relaxed">Son {total} preguntas sobre tu momento, tu descanso y lo que te trae, para que tu primera sesión empiece con más contexto. Va una por una: responde a tu ritmo, salta las que no quieras y vuelve cuando quieras. Se guarda sola.</p>
            </div>
            <button type="button" onClick={() => animar(() => setIntro(false), 'adelante')} className={`${btnPri} self-start`}>Empezar <ArrowRight size={17} /></button>
          </section>
        </Marco>
      );
    }

    const p = PREGUNTAS_ENTREVISTA[paso];
    const sec = SECCIONES.find((x) => x.titulo === p.seccion);
    const primeraDeSeccion = sec?.preguntas[0].id === p.id;
    const ultima = paso === total - 1;
    const lista = respondida(p);
    const mover = (d) => { guardar(resp); animar(() => setPaso(paso + d), d > 0 ? 'adelante' : 'atras'); };
    const siguiente = async () => {
      if (!ultima) { mover(1); return; }
      if (await guardar(resp, true)) { setRecienEnviada(true); ir('inicio', 'atras'); }
    };
    return (
      <Marco>
        <div ref={arriba} />
        <div className="flex items-center justify-between gap-3">
          {volverAlEspacio}
          <span className="text-[12.5px] text-zinc-500 tabular">{paso + 1} de {total}</span>
        </div>
        <div className="h-1 rounded-full bg-raised overflow-hidden -mt-2">
          <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${((paso + 1) / total) * 100}%` }} />
        </div>
        {avisoDemo}

        <section style={vt('paso')} className="min-h-[50vh] flex flex-col gap-6 pt-3">
          <div className="space-y-2.5">
            <p className="text-[12px] uppercase tracking-[0.09em] text-emerald-300/80">{p.seccion}<span className="normal-case tracking-normal text-zinc-500"> · {p.etiqueta || ''}</span></p>
            <h1 className="text-[23px] xs:text-[27px] font-medium tracking-tight leading-snug text-ink">{p.titulo}</h1>
            {primeraDeSeccion && <p className="text-[14px] text-zinc-500">{sec.descripcion}</p>}
          </div>
          <Respuesta key={p.id} p={p} valor={resp[p.id]} onCambio={(v) => setResp((r) => ({ ...r, [p.id]: v }))} onListo={siguiente} />
        </section>

        <div className="flex items-center gap-2">
          {paso > 0 && <button type="button" onClick={() => mover(-1)} className={btnSec}><ArrowLeft size={16} /> Atrás</button>}
          <div className="flex-1" />
          {!lista && <button type="button" onClick={siguiente} className={btnSec}>{ultima ? 'Terminar' : 'Saltar'}</button>}
          {lista && (
            <button type="button" onClick={siguiente} className={btnPri}>
              {ultima ? <><Check size={16} /> {completada ? 'Guardar cambios' : 'Enviar a mi terapeuta'}</> : <>Siguiente <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
        {estadoGuardado && <p className="text-center text-[12px] text-zinc-600 -mt-2">{estadoGuardado}</p>}
      </Marco>
    );
  }

  // Inicio de Mi espacio
  return (
    <Marco>
      <div ref={arriba} />
      <Encabezado paso={`Hola, ${registro.alias}`} onSalir={salir} />
      {avisoDemo}
      {recienEnviada && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[14px] text-emerald-100">Listo: tu entrevista llegó a tu terapeuta. Puedes cambiar tus respuestas cuando quieras.</p>}

      <section className="rounded-2xl border border-line bg-surface">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink"><ClipboardList size={17} className="text-emerald-300" /> Entrevista inicial</h2>
            <span className="text-[12.5px] text-zinc-500 tabular">{completada ? 'Enviada' : `${hechas} de ${total}`}</span>
          </div>
          <div className="h-1 rounded-full bg-raised overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${(hechas / total) * 100}%` }} /></div>
          <button type="button" onClick={() => animar(() => { const k = PREGUNTAS_ENTREVISTA.findIndex((x) => !respondida(x)); setPaso(completada || k < 0 ? 0 : k); setIntro(hechas === 0); setVista('entrevista'); setRecienEnviada(false); }, 'adelante', true)} className={`${btnPri} w-full`}>
            {completada ? 'Revisar mis respuestas' : hechas ? 'Continuar' : 'Empezar'} <ArrowRight size={16} />
          </button>
        </div>
        <ul className="divide-y divide-line border-t border-line">
          {SECCIONES.map((s, i) => {
            const n = s.preguntas.filter(respondida).length;
            return (
              <li key={s.id}>
                <button type="button" onClick={() => abrirSeccion(i)} className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-white/[0.025]">
                  <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center text-[11.5px] ${n === s.preguntas.length ? 'bg-emerald-400/15 text-emerald-300' : 'bg-raised text-zinc-500'}`}>
                    {n === s.preguntas.length ? <Check size={13} /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-[15px] text-ink">{s.titulo}</span>
                  <span className="text-[12.5px] text-zinc-500 tabular">{n}/{s.preguntas.length}</span>
                  <ChevronRight size={16} className="text-zinc-600" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <button type="button" onClick={() => ir('consentimiento')} className="w-full rounded-2xl border border-line bg-surface p-4 flex items-center gap-3 text-left hover:bg-white/[0.025]">
        <FileSignature size={18} className="text-emerald-300 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium text-ink">Consentimiento informado</span>
          <span className="block text-[13px] text-zinc-500">{consentimiento.metodo === 'audio' ? 'Confirmado con tu voz' : 'Firmado'} el {fechaLarga(consentimiento.aceptado_en)} · ver constancia</span>
        </span>
        <ChevronRight size={16} className="text-zinc-600" />
      </button>
    </Marco>
  );
}
