import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp, Copy, Settings2, Plus, FileText, Trash2, NotebookPen, ShieldCheck, Mic, Sparkles,
  BookOpen, AudioLines, ChevronDown, ChevronUp, FilePlus2, Upload, RotateCcw, Type,
} from 'lucide-react';
import { useRuta, vt } from '../rutas';
import { useAviso } from '../aviso';
import { Pantalla, Subtabs, Seccion, FilaEnlace, Vacio, Campo, Confirmar, inp, area, btnPri, btnSec, btnTxt } from '../ui';
import { savePatientNote } from '../../utils/storage';
import { hayNube } from '../../utils/nube';
import { estadoIA, transcribirAudio, preguntarIA } from '../../utils/ia';
import { MARCOS, FORMATOS_NOTA, armarSistema } from '../../data/asistente';
import { RESUMIR_SESION, NOTA_DE_SESION } from '../../data/cuaderno';
import { useCuaderno, usePortalLista, useAjustesAsistente, sesionesDe, fechaCorta } from './useCuaderno';

// Estado de la conexión con Cloudflare (una sola consulta por visita)
let estadoCache = null;
function useConexion() {
  const [estado, setEstado] = useState(estadoCache);
  useEffect(() => { if (!estadoCache) estadoIA().then((e) => { estadoCache = e; setEstado(e); }); }, []);
  return { conectado: !!(estado?.servidor && estado?.conectada), modelo: estado?.modelo };
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

function useCopiar() {
  const aviso = useAviso();
  return (texto, mensaje = 'Copiado') => navigator.clipboard?.writeText(texto).then(() => aviso(mensaje)).catch(() => aviso('No se pudo copiar', 'error'));
}

/** Botón de solo ícono, con nombre para lectores de pantalla y tooltip. */
function Icono({ icono: I, etiqueta, onClick, activo = false, tamaño = 'w-10 h-10', className = '', ...resto }) {
  return (
    <button type="button" onClick={onClick} aria-label={etiqueta} title={etiqueta} {...resto}
      className={`${tamaño} shrink-0 grid place-items-center rounded-full transition active:scale-95 disabled:opacity-40 ${activo ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300' : 'text-zinc-400 hover:text-ink hover:bg-white/[0.04]'} ${className}`}>
      <I size={18} />
    </button>
  );
}

/** Cuadernos: un cuaderno por caso, con chat y memoria (sesiones, expediente y documentos). */
export default function Cuadernos({ caso, vista, param, patients, therapist }) {
  const portal = usePortalLista(therapist);
  if (!caso) return <ListaCuadernos patients={patients} portal={portal} />;
  if (caso === 'directrices') return <Directrices />;
  return <Cuaderno caso={caso} vista={vista} param={param} patients={patients} portal={portal} />;
}

// ---------- Lista de casos ----------

function ListaCuadernos({ patients, portal }) {
  const { navegar } = useRuta();
  const casos = [
    ...patients.filter((p) => p.estado !== 'Alta').map((p) => ({ caso: `exp:${p.id}`, nombre: p.nombre, codigo: p.codigo })),
    ...portal.map((x) => ({ caso: `pt:${x.id}`, nombre: x.alias, codigo: `@${x.usuario}` })),
  ].map((c) => ({ ...c, sesiones: sesionesDe(c.caso) }));

  return (
    <Pantalla grande titulo="Cuadernos" acciones={<Icono icono={Settings2} etiqueta="Directrices" onClick={() => navegar(['cuadernos', 'directrices'])} />}>
      <div className="max-w-2xl">
        <Seccion>
          <div className="divide-y divide-line">
            {casos.length === 0 && (
              <Vacio titulo="Sin casos" icono={BookOpen} accion={<button type="button" onClick={() => navegar(['consultantes', 'nuevo'])} className={btnPri}><Plus size={16} /> Crear expediente</button>} />
            )}
            {casos.map((c) => (
              <FilaEnlace key={c.caso} onClick={() => navegar(['cuadernos', c.caso])}
                derecha={<span className="text-[12.5px] text-zinc-500 tabular flex items-center gap-1.5"><AudioLines size={13} />{c.sesiones.length}</span>}>
                <span className="flex items-baseline gap-2.5 min-w-0">
                  <span className="text-[12.5px] text-zinc-500 tabular shrink-0">{c.codigo}</span>
                  <span style={vt(`cu-${c.caso}`)} className="text-[15px] font-medium text-ink truncate">{c.nombre}</span>
                </span>
              </FilaEnlace>
            ))}
          </div>
        </Seccion>
      </div>
    </Pantalla>
  );
}

// ---------- Cuaderno de un caso: Chat y Memoria ----------

function Cuaderno({ caso, vista, param, patients, portal }) {
  const cu = useCuaderno(caso, { patients, portal });
  const con = useConexion();
  const { navegar } = useRuta();

  if (vista === 'sesiones' && param === 'nueva') return <NuevaSesion cu={cu} con={con} />;
  if (vista === 'sesiones' && param) return <SesionDetalle cu={cu} con={con} id={param} />;
  if (vista === 'documentos' && param === 'nuevo') return <NuevoDocumento cu={cu} />;

  const tab = ['memoria', 'proceso', 'fuentes'].includes(vista) ? 'memoria' : 'chat';

  return (
    <Pantalla atras={['cuadernos']} etiquetaAtras="Cuadernos" titulo={cu.nombre} tituloVT={`cu-${caso}`} ancho="max-w-5xl"
      subtitulo={(
        <span className="flex items-center gap-2">
          {cu.codigo && <span className="tabular">{cu.codigo}</span>}
          <span title={con.conectado ? 'Asistente conectado' : 'Asistente sin conectar'} className={`w-1.5 h-1.5 rounded-full ${con.conectado ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
        </span>
      )}
      acciones={(
        <>
          {cu.chat.length > 0 && <Icono icono={RotateCcw} etiqueta="Nueva conversación" onClick={() => cu.setChat([])} />}
          <Icono icono={Settings2} etiqueta="Directrices" onClick={() => navegar(['cuadernos', 'directrices'])} />
        </>
      )}>
      <div className="lg:hidden">
        <Subtabs items={[{ id: 'chat', label: 'Chat' }, { id: 'memoria', label: 'Memoria', cuenta: cu.sesiones.length || null }]}
          activo={tab} onCambio={(t) => navegar(['cuadernos', caso, t], { reemplazar: true })} />
      </div>
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 items-start">
        <aside className={tab === 'memoria' ? '' : 'hidden lg:block'}><Memoria cu={cu} /></aside>
        <div className={tab === 'chat' ? '' : 'hidden lg:block'}><Chat cu={cu} con={con} /></div>
      </div>
    </Pantalla>
  );
}

function Chat({ cu, con }) {
  const { navegar } = useRuta();
  const aviso = useAviso();
  const copiar = useCopiar();
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState('');
  const finRef = useRef(null);
  const campoRef = useRef(null);
  useEffect(() => { if (cu.chat.length || pensando) finRef.current?.scrollIntoView({ block: 'nearest' }); }, [cu.chat, pensando]);
  useEffect(() => { const c = campoRef.current; if (c) { c.style.height = 'auto'; c.style.height = `${Math.min(c.scrollHeight, 160)}px`; } }, [texto]);

  const enviar = async () => {
    const pregunta = texto.trim();
    if (!pregunta || pensando) return;
    if (!con.conectado) { copiar(cu.comoPrompt(pregunta), 'Prompt copiado, pégalo en Claude'); return; }
    setError('');
    const conPregunta = [...cu.chat, { role: 'user', content: cu.limpiar(pregunta), fecha: new Date().toISOString() }];
    cu.setChat(conPregunta);
    setTexto('');
    setPensando(true);
    try {
      const respuesta = await cu.preguntar(pregunta, { historial: cu.chat });
      cu.setChat([...conPregunta, { role: 'assistant', content: respuesta, fecha: new Date().toISOString() }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setPensando(false);
    }
  };

  const guardarNota = (contenido) => {
    savePatientNote(cu.paciente.id, { tipo: `Nota ${FORMATOS_NOTA[cu.ajustes.formato]?.nombre || ''} (cuaderno)`.trim(), contenido });
    aviso('Guardada en el expediente');
  };

  const vacio = cu.chat.length === 0;
  const memoria = [cu.paciente && 'ficha', cu.fuentes.some((f) => f.id === 'notas') && 'notas', cu.delPortal && 'entrevista',
    cu.sesiones.length && `${cu.sesiones.length} ${cu.sesiones.length === 1 ? 'sesión' : 'sesiones'}`].filter(Boolean);
  const errorCaja = error && <p className="mb-2 rounded-2xl bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-200">{error}</p>;
  const campo = (
    <textarea ref={campoRef} rows={vacio ? 3 : 1} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Pregunta para el asistente"
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
      placeholder={vacio ? 'Pregunta sobre el caso o pega tus apuntes…' : 'Escribe…'}
      className={`flex-1 w-full min-w-0 bg-transparent outline-none resize-none text-[15px] leading-6 text-ink placeholder:text-zinc-600 ${vacio ? 'px-2 pt-1.5 min-h-[72px]' : 'py-2 px-1'}`} />
  );
  const sesion = <Icono icono={Mic} etiqueta="Agregar sesión a la memoria" onClick={() => navegar(['cuadernos', cu.caso, 'sesiones', 'nueva'])} />;
  const mandar = <Icono icono={con.conectado ? ArrowUp : Copy} etiqueta={con.conectado ? 'Enviar' : 'Copiar como prompt para Claude'} activo onClick={enviar} disabled={!texto.trim() || pensando} />;

  // Sin conversación: la caja va al centro, grande, como punto de partida
  if (vacio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-320px)] lg:min-h-[calc(100dvh-240px)] py-8">
        <div className="w-full max-w-xl text-center animate-entrada">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-surface ring-1 ring-line grid place-items-center text-emerald-300"><Sparkles size={20} /></span>
          <h2 className="font-display text-[30px] xs:text-[36px] leading-tight text-ink mt-4">¿Qué quieres saber del caso?</h2>
          <p className="text-[14px] text-zinc-500 mt-1.5">Responde solo con lo que hay en su memoria.</p>
          <div className="mt-6 text-left">
            {errorCaja}
            <div className="rounded-3xl bg-surface ring-1 ring-line focus-within:ring-emerald-400/50 shadow-suave p-2.5 transition">
              {campo}
              <div className="flex items-center justify-between gap-2 mt-1">{sesion}{mandar}</div>
            </div>
          </div>
          {memoria.length > 0 && (
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12.5px] text-zinc-500">
              {memoria.map((m) => <span key={m} className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" aria-hidden="true" />{m}</span>)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-300px)] lg:min-h-[calc(100dvh-220px)]">
      <div className="flex-1 space-y-6 pb-4">
        {cu.chat.map((m, i) => (m.role === 'user' ? (
          <div key={i} className="flex justify-end animate-entrada">
            <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-raised px-4 py-2.5 text-[15px] leading-relaxed text-ink whitespace-pre-wrap break-words">{m.content}</p>
          </div>
        ) : (
          <div key={i} className="animate-entrada">
            <p className="text-[15px] leading-relaxed text-zinc-100 whitespace-pre-wrap break-words">{m.content}</p>
            <div className="flex gap-0.5 mt-1.5 -ml-2.5">
              <Icono icono={Copy} etiqueta="Copiar" tamaño="w-9 h-9" className="text-zinc-500" onClick={() => copiar(m.content)} />
              {cu.paciente && <Icono icono={NotebookPen} etiqueta="Guardar como nota en el expediente" tamaño="w-9 h-9" className="text-zinc-500" onClick={() => guardarNota(m.content)} />}
            </div>
          </div>
        )))}
        {pensando && <p className="flex gap-1 py-2" aria-label="Pensando">{[0, 1, 2].map((n) => <span key={n} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: `${n * 150}ms` }} />)}</p>}
        <div ref={finRef} />
      </div>
      <div className="sticky bottom-[calc(68px+env(safe-area-inset-bottom))] bajo:bottom-[58px] lg:bottom-6 pt-2 bg-base">
        {errorCaja}
        <div className="flex items-end gap-1 rounded-full bg-surface ring-1 ring-line focus-within:ring-emerald-400/50 shadow-suave p-1.5 transition">
          {sesion}{campo}{mandar}
        </div>
      </div>
    </div>
  );
}

// ---------- Memoria: sesiones, expediente y documentos ----------

function Memoria({ cu }) {
  const { navegar } = useRuta();
  const otras = cu.fuentes.filter((f) => !f.sesion);
  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center justify-between mb-2 pl-1">
          <p className="text-[12px] uppercase tracking-[0.09em] text-zinc-500">Sesiones</p>
          <Icono icono={Plus} etiqueta="Agregar sesión" tamaño="w-9 h-9" onClick={() => navegar(['cuadernos', cu.caso, 'sesiones', 'nueva'])} />
        </div>
        {cu.sesiones.length === 0 ? (
          <button type="button" onClick={() => navegar(['cuadernos', cu.caso, 'sesiones', 'nueva'])}
            className="w-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line hover:border-zinc-600 py-8 text-zinc-500 hover:text-zinc-300 transition active:scale-[.99]">
            <Mic size={20} />
            <span className="text-[13.5px]">Sube el audio de una sesión</span>
          </button>
        ) : (
          <ol className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {cu.sesiones.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => navegar(['cuadernos', cu.caso, 'sesiones', s.id])}
                  className="w-full text-left flex items-start gap-3 px-3.5 py-3 hover:bg-white/[0.025] active:bg-white/[0.04] transition-colors">
                  <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30 grid place-items-center text-[11px] text-emerald-200 tabular">{i + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span style={vt(`ses-${s.id}`)} className="text-[14.5px] font-medium text-ink truncate">{s.titulo}</span>
                      <span className="text-[12px] text-zinc-500 tabular shrink-0">{fechaCorta(s.fecha)}</span>
                    </span>
                    {s.resumen && <span className="text-[13px] text-zinc-500 mt-0.5 line-clamp-1">{s.resumen}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 pl-1">
          <p className="text-[12px] uppercase tracking-[0.09em] text-zinc-500">Expediente</p>
          <Icono icono={FilePlus2} etiqueta="Agregar documento" tamaño="w-9 h-9" onClick={() => navegar(['cuadernos', cu.caso, 'documentos', 'nuevo'])} />
        </div>
        {otras.length === 0 ? <p className="pl-1 text-[13.5px] text-zinc-600">Nada todavía.</p> : (
          <ul className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
            {otras.map((f) => {
              const activa = cu.elegidas[f.id] !== false;
              return (
                <li key={f.id} className="flex items-center gap-1 pr-1.5">
                  <button type="button" role="switch" aria-checked={activa} onClick={() => cu.setElegidas({ ...cu.elegidas, [f.id]: !activa })}
                    className="flex-1 min-w-0 flex items-center gap-3 h-12 px-3.5 text-left">
                    <FileText size={15} className={activa ? 'text-zinc-400 shrink-0' : 'text-zinc-700 shrink-0'} />
                    <span className={`flex-1 text-[14px] truncate ${activa ? 'text-zinc-200' : 'text-zinc-600 line-through decoration-zinc-700'}`}>{f.titulo}</span>
                    <span aria-hidden="true" className={`w-8 h-[18px] rounded-full p-0.5 transition-colors shrink-0 ${activa ? 'bg-emerald-400/80' : 'bg-zinc-700'}`}>
                      <span className={`block w-3.5 h-3.5 rounded-full bg-[#fff] transition-transform ${activa ? 'translate-x-3.5' : ''}`} />
                    </span>
                  </button>
                  {f.doc && <Icono icono={Trash2} etiqueta={`Quitar ${f.titulo}`} tamaño="w-8 h-8" className="text-zinc-600 hover:!text-rose-300" onClick={() => cu.quitarDoc(f.id.slice(4))} />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {cu.ajustes.desidentificar && (
        <p className="flex items-center gap-2 pl-1 text-[12.5px] text-zinc-600"><ShieldCheck size={14} className="text-emerald-300/70" /> Se desidentifica antes de enviar</p>
      )}
    </div>
  );
}

// ---------- Nueva sesión: audio o texto ----------

function NuevaSesion({ cu, con }) {
  const { navegar } = useRuta();
  const aviso = useAviso();
  const [fecha, setFecha] = useState(hoyISO());
  const [titulo, setTitulo] = useState(`Sesión ${cu.sesiones.length + 1}`);
  const [origen, setOrigen] = useState('audio');
  const [texto, setTexto] = useState('');
  const [archivo, setArchivo] = useState('');
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [resumir, setResumir] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const subir = async (a) => {
    if (!a) return;
    setError('');
    setArchivo(a.name);
    setTranscribiendo(true);
    try {
      const t = await transcribirAudio(a, cu.ajustes.clave);
      setTexto((x) => (x.trim() ? `${x.trim()}\n\n${t}` : t));
      aviso('Audio transcrito');
    } catch (e) {
      setError(e.message);
    } finally {
      setTranscribiendo(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setGuardando(true);
    const s = cu.guardarSesion({ fecha: new Date(`${fecha}T12:00:00`).toISOString(), titulo: titulo.trim() || 'Sesión', transcripcion: texto.trim(), origen });
    let final = s;
    if (resumir && con.conectado) {
      try {
        const resumen = await preguntarIA({ sistema: armarSistema(cu.ajustes, cu.limpiar(`### Transcripción de la sesión\n${s.transcripcion}`)), mensajes: [{ role: 'user', content: RESUMIR_SESION }], clave: cu.ajustes.clave });
        final = cu.guardarSesion({ ...s, resumen });
      } catch (_) { /* se puede generar después desde la sesión */ }
    }
    setGuardando(false);
    aviso('Sesión guardada');
    navegar(['cuadernos', cu.caso, 'sesiones', final.id], { reemplazar: true });
  };

  return (
    <Pantalla atras={['cuadernos', cu.caso, 'memoria']} etiquetaAtras={cu.nombre} titulo="Nueva sesión" ancho="max-w-2xl">
      <form onSubmit={guardar} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo etiqueta="Fecha"><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} /></Campo>
          <Campo etiqueta="Título"><input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inp} /></Campo>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-surface border border-line w-fit">
          {[['audio', 'Audio', Mic], ['texto', 'Texto', Type]].map(([v, l, I]) => (
            <button key={v} type="button" onClick={() => setOrigen(v)}
              className={`h-9 px-3.5 rounded-lg text-[13.5px] inline-flex items-center gap-2 transition-colors ${origen === v ? 'bg-raised text-ink ring-1 ring-line' : 'text-zinc-500 hover:text-ink'}`}><I size={15} />{l}</button>
          ))}
        </div>
        {origen === 'audio' && (
          <label className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition ${con.conectado ? 'border-zinc-600 hover:border-emerald-400/60 cursor-pointer' : 'border-line opacity-60 cursor-not-allowed'}`}>
            <span className="w-12 h-12 rounded-2xl bg-raised ring-1 ring-line grid place-items-center text-zinc-300">{transcribiendo ? <AudioLines size={20} className="animate-pulse" /> : <Upload size={20} />}</span>
            <span className="text-[15px] font-medium text-ink">{transcribiendo ? 'Transcribiendo…' : archivo || 'Elegir audio'}</span>
            <span className="text-[12.5px] text-zinc-500">{con.conectado ? 'Hasta 25 MB · el audio no se guarda' : 'Requiere Cloudflare · usa Texto'}</span>
            <input type="file" accept="audio/*" className="sr-only" disabled={!con.conectado || transcribiendo} onChange={(e) => { subir(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        )}
        {(origen === 'texto' || texto) && (
          <Campo etiqueta={origen === 'audio' ? 'Transcripción (puedes corregirla)' : 'Texto de la sesión'}>
            <textarea rows={12} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pega la transcripción o tus apuntes…" className={area} />
          </Campo>
        )}
        {con.conectado && (
          <label className="flex items-center gap-3 text-[14px] text-zinc-300">
            <input type="checkbox" checked={resumir} onChange={(e) => setResumir(e.target.checked)} className="accent-emerald-400 w-4 h-4" /> Resumir al guardar
          </label>
        )}
        {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-[13.5px] text-rose-200">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={!texto.trim() || guardando || transcribiendo} className={btnPri}>{guardando ? 'Guardando…' : 'Guardar sesión'}</button>
          <button type="button" onClick={() => navegar(['cuadernos', cu.caso, 'memoria'], { reemplazar: true })} className={btnTxt}>Cancelar</button>
        </div>
      </form>
    </Pantalla>
  );
}

// ---------- Detalle de una sesión ----------

function SesionDetalle({ cu, con, id }) {
  const { navegar } = useRuta();
  const aviso = useAviso();
  const copiar = useCopiar();
  const [verTodo, setVerTodo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState('');
  const [trabajando, setTrabajando] = useState('');
  const [error, setError] = useState('');
  const [borrando, setBorrando] = useState(false);
  const i = cu.sesiones.findIndex((s) => s.id === id);
  const s = cu.sesiones[i];
  if (!s) return <Pantalla atras={['cuadernos', cu.caso, 'memoria']} etiquetaAtras={cu.nombre} titulo="No encontrada"><Vacio>Esta sesión ya no existe.</Vacio></Pantalla>;

  const formato = FORMATOS_NOTA[cu.ajustes.formato]?.nombre || 'SOAP';
  const contexto = () => cu.limpiar(`### Transcripción de la sesión ${i + 1} (${fechaCorta(s.fecha)})\n${s.transcripcion}`);
  const pedir = async (que, instruccion) => {
    if (!con.conectado) { copiar(`${armarSistema(cu.ajustes, contexto())}\n\nPREGUNTA:\n${instruccion}`, 'Prompt copiado para pegar en Claude'); return; }
    setError('');
    setTrabajando(que);
    try {
      const r = await preguntarIA({ sistema: armarSistema(cu.ajustes, contexto()), mensajes: [{ role: 'user', content: instruccion }], clave: cu.ajustes.clave });
      cu.guardarSesion({ ...s, [que]: r });
      aviso(que === 'resumen' ? 'Resumen listo' : 'Nota redactada');
    } catch (e) {
      setError(e.message);
    } finally {
      setTrabajando('');
    }
  };

  return (
    <Pantalla atras={['cuadernos', cu.caso, 'memoria']} etiquetaAtras={cu.nombre} titulo={s.titulo} tituloVT={`ses-${s.id}`}
      subtitulo={`Sesión ${i + 1} · ${fechaCorta(s.fecha)}${s.origen === 'audio' ? ' · desde audio' : ''}`} ancho="max-w-3xl">
      <div className="space-y-6">
        <Seccion titulo="Resumen" accion={s.resumen && <button type="button" onClick={() => pedir('resumen', RESUMIR_SESION)} disabled={!!trabajando} className={btnTxt}>{trabajando === 'resumen' ? 'Resumiendo…' : 'Rehacer'}</button>}>
          {s.resumen
            ? <p className="p-4 text-[15px] leading-relaxed text-zinc-200 whitespace-pre-wrap">{s.resumen}</p>
            : <Vacio titulo="Sin resumen" accion={<button type="button" onClick={() => pedir('resumen', RESUMIR_SESION)} disabled={!!trabajando} className={btnSec}><Sparkles size={15} /> {trabajando === 'resumen' ? 'Resumiendo…' : con.conectado ? 'Resumir sesión' : 'Copiar prompt'}</button>} />}
        </Seccion>

        <Seccion titulo={`Nota de evolución · ${formato}`}
          accion={s.nota && <button type="button" onClick={() => pedir('nota', NOTA_DE_SESION(formato))} disabled={!!trabajando} className={btnTxt}>{trabajando === 'nota' ? 'Redactando…' : 'Rehacer'}</button>}>
          {s.nota ? (
            <div className="p-4 space-y-3">
              <p className="text-[15px] leading-relaxed text-zinc-200 whitespace-pre-wrap">{s.nota}</p>
              <div className="flex flex-wrap gap-2">
                {cu.paciente && <button type="button" onClick={() => { savePatientNote(cu.paciente.id, { tipo: `Nota ${formato} · ${s.titulo}`, contenido: s.nota }); aviso('Guardada en el expediente'); }} className={btnSec}><NotebookPen size={15} /> Guardar en el expediente</button>}
                <button type="button" onClick={() => copiar(s.nota)} className={btnSec}><Copy size={15} /> Copiar</button>
              </div>
            </div>
          ) : (
            <Vacio titulo="Sin nota todavía" accion={<button type="button" onClick={() => pedir('nota', NOTA_DE_SESION(formato))} disabled={!!trabajando} className={btnPri}><NotebookPen size={15} /> {trabajando === 'nota' ? 'Redactando…' : con.conectado ? 'Redactar nota' : 'Copiar prompt'}</button>}>
              Se redacta con la transcripción y el formato de tus directrices.
            </Vacio>
          )}
        </Seccion>

        <Seccion titulo="Transcripción"
          accion={!editando && <button type="button" onClick={() => { setBorrador(s.transcripcion); setEditando(true); setVerTodo(true); }} className={btnTxt}>Corregir</button>}>
          {editando ? (
            <div className="p-4 space-y-3">
              <textarea rows={14} value={borrador} onChange={(e) => setBorrador(e.target.value)} aria-label="Transcripción" className={area} />
              <div className="flex gap-2">
                <button type="button" onClick={() => { cu.guardarSesion({ ...s, transcripcion: borrador }); setEditando(false); aviso('Transcripción guardada'); }} className={btnPri}>Guardar</button>
                <button type="button" onClick={() => setEditando(false)} className={btnTxt}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className={`text-[14.5px] leading-relaxed text-zinc-300 whitespace-pre-wrap ${verTodo ? '' : 'line-clamp-6'}`}>{s.transcripcion}</p>
              {s.transcripcion.length > 400 && (
                <button type="button" onClick={() => setVerTodo(!verTodo)} className={`${btnTxt} -ml-3 mt-1`}>{verTodo ? <><ChevronUp size={15} /> Ver menos</> : <><ChevronDown size={15} /> Ver completa</>}</button>
              )}
            </div>
          )}
        </Seccion>

        {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-[13.5px] text-rose-200">{error}</p>}
        {borrando
          ? <Confirmar pregunta={`¿Borrar “${s.titulo}”? Se pierden su transcripción, resumen y nota en este cuaderno.`} siTexto="Sí, borrar" onNo={() => setBorrando(false)} onSi={() => { cu.borrarSesion(s.id); aviso('Sesión borrada'); navegar(['cuadernos', cu.caso, 'memoria'], { reemplazar: true }); }} />
          : <button type="button" onClick={() => setBorrando(true)} className="text-[13.5px] text-rose-300/80 hover:text-rose-300">Borrar sesión</button>}
      </div>
    </Pantalla>
  );
}

function NuevoDocumento({ cu }) {
  const { navegar, atras } = useRuta();
  const aviso = useAviso();
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const leerArchivo = (a) => {
    if (!a) return;
    const lector = new FileReader();
    lector.onload = () => { setTitulo((t) => t || a.name.replace(/\.[^.]+$/, '')); setTexto(String(lector.result || '')); };
    lector.readAsText(a);
  };
  return (
    <Pantalla atras={['cuadernos', cu.caso, 'memoria']} etiquetaAtras={cu.nombre} titulo="Nuevo documento" ancho="max-w-2xl">
      <form onSubmit={(e) => { e.preventDefault(); if (!texto.trim()) return; cu.agregarDoc(titulo.trim(), texto.trim()); aviso('Documento agregado'); navegar(['cuadernos', cu.caso, 'memoria'], { reemplazar: true }); }} className="space-y-4">
        <Campo etiqueta="Título"><input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Informe escolar 2025" className={inp} /></Campo>
        <Campo etiqueta="Texto"><textarea rows={12} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pega aquí el texto…" className={area} /></Campo>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={!texto.trim()} className={btnPri}>Agregar</button>
          <label className={`${btnSec} cursor-pointer`}><Upload size={15} /> Subir .txt<input type="file" accept=".txt,.md,text/plain" className="sr-only" onChange={(e) => leerArchivo(e.target.files?.[0])} /></label>
          <button type="button" onClick={() => atras()} className={btnTxt}>Cancelar</button>
        </div>
      </form>
    </Pantalla>
  );
}

// ---------- Directrices ----------

function Directrices() {
  const [ajustes, setAjustes] = useAjustesAsistente();
  return (
    <Pantalla atras={['cuadernos']} etiquetaAtras="Cuadernos" titulo="Directrices" ancho="max-w-2xl">
      <div className="space-y-5">
        <Campo etiqueta="Marco teórico">
          <select value={ajustes.marco} onChange={(e) => setAjustes({ ...ajustes, marco: e.target.value })} className={inp}>
            {Object.entries(MARCOS).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Formato de notas">
          <select value={ajustes.formato} onChange={(e) => setAjustes({ ...ajustes, formato: e.target.value })} className={inp}>
            {Object.entries(FORMATOS_NOTA).map(([id, f]) => <option key={id} value={id}>{f.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Tus indicaciones para el asistente">
          <textarea rows={4} value={ajustes.instrucciones} onChange={(e) => setAjustes({ ...ajustes, instrucciones: e.target.value })}
            placeholder="Ej. Usa terminología CIE-11. Evita lenguaje patologizante. Responde en viñetas." className={area} />
        </Campo>
        <label className="flex items-start gap-3 text-[14px] text-zinc-300">
          <input type="checkbox" checked={ajustes.desidentificar} onChange={(e) => setAjustes({ ...ajustes, desidentificar: e.target.checked })} className="mt-1 accent-emerald-400 w-4 h-4" />
          <span>Quitar nombres, teléfonos y correos antes de enviar <span className="block text-[12.5px] text-zinc-500">Recomendado. Revisa igual que tus apuntes no lleven datos que identifiquen a la persona.</span></span>
        </label>
        {!hayNube && (
          <Campo etiqueta="Clave de acceso del asistente (la que pusiste en el servidor)">
            <input type="password" value={ajustes.clave} onChange={(e) => setAjustes({ ...ajustes, clave: e.target.value })} className={inp} autoComplete="off" />
          </Campo>
        )}
        <p className="text-[12.5px] text-zinc-500">Se guarda solo.</p>
      </div>
    </Pantalla>
  );
}
