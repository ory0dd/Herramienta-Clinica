import React, { useMemo, useState } from 'react';
import { Check, Wallet, Send, Copy, Plus, MessageCircle, CalendarSync, RefreshCw, Unplug, ChevronLeft, ChevronRight, CalendarClock, CalendarX, Pencil, ShieldCheck, Sparkles, ArrowUp } from 'lucide-react';
import { preguntarIA, estadoIA, claveGuardada } from '../../utils/ia';
import { nuevoId, numeroWhatsApp } from './useAgenda';
import {
  sesionesDelMes, horaCorta, nombreDia, fmtFecha, fmtHora, parseFechaHora, addDias, proximasSesiones, acciones,
  DIAS, MESES, MENSAJE_BASE, pesos, fmtFechaHora,
} from '../../utils/miLista';
import { useRuta, vt } from '../rutas';
import { useAviso } from '../aviso';
import { CLIENT_ID, sincronizar, desconectar, sesionesParaCalendario } from '../../utils/calendario';
import { getGoogle } from '../../utils/miLista';
import { Pantalla, Subtabs, Seccion, FilaEnlace, Vacio, Campo, Confirmar, inp, area, btnPri, btnSec, btnTxt } from '../ui';
import { useAgenda } from './useAgenda';

const MES3 = MESES.map((m) => m.slice(0, 3));
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fechaLarga = (d) => `${mayus(DIAS[d.getDay()])} ${d.getDate()} de ${MESES[d.getMonth()]}`;

const ESTADOS = [
  { id: 'confirmo', label: 'confirmó', punto: 'bg-fuchsia-400' },
  { id: 'sin', label: 'sin confirmar', punto: 'bg-sky-400' },
  { id: 'preguntar', label: 'preguntar', punto: 'bg-violet-400' },
  { id: 'pago', label: 'ya pasó (pagó)', punto: 'bg-zinc-500' },
  { id: 'debe', label: 'ya pasó (debe)', punto: 'bg-rose-400' },
];
const estadoDe = (f) => (f.pasada ? (f.pago?.estado === 'pagado' ? 'pago' : 'debe') : f.preguntar ? 'preguntar' : f.confirmado ? 'confirmo' : 'sin');
const puntoDe = (id) => ESTADOS.find((e) => e.id === id)?.punto || 'bg-zinc-500';

function Chip({ punto, children }) {
  return <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-400"><span className={`w-1.5 h-1.5 rounded-full ${punto}`} />{children}</span>;
}

function Icono({ title, onClick, activo, tono = 'violeta', children }) {
  const tonos = { violeta: 'bg-fuchsia-400/15 text-fuchsia-200', verde: 'bg-emerald-400/15 text-emerald-200', rojo: 'bg-rose-400/15 text-rose-200' };
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick}
      className={`w-9 h-9 grid place-items-center rounded-xl transition-colors ${activo ? tonos[tono] : 'text-zinc-500 hover:text-ink hover:bg-white/[0.05]'}`}>
      {children}
    </button>
  );
}

/** Chips de estado de una sesión. */
function Estados({ f, pago }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1 mt-1 empty:hidden">
      {f.confirmado && <Chip punto="bg-fuchsia-400">confirmó</Chip>}
      {f.avisado && !f.confirmado && <Chip punto="bg-zinc-500">ya le escribiste</Chip>}
      {pago && <Chip punto={pago.estado === 'pagado' ? 'bg-emerald-400' : 'bg-rose-400'}>{pago.estado === 'pagado' ? 'pagó' : 'debe'}</Chip>}
      {f.c.solo_esta_vez && f.c.solo_esta_vez === f.clave && <Chip punto="bg-sky-400">solo esta vez</Chip>}
      {!numeroWhatsApp(f.c.telefono) && <span className="text-[12px] text-zinc-600">sin WhatsApp</span>}
    </span>
  );
}

/** Una sesión en una lista: se toca para abrir a la persona; los botones hacen lo rápido. */
function FilaSesion({ f, ag, conDia, destacarAviso, nombreVT, onAbrir }) {
  const pago = f.clave ? ag.pagoDe(f) : null;
  const { navegar } = useRuta();
  const tieneWhats = !!numeroWhatsApp(f.c.telefono);
  // Con número: abre WhatsApp con el aviso escrito. Sin número: lleva a registrarlo.
  const avisar = () => { if (!ag.avisar(f)) navegar(['agenda', 'personas', f.c.id, 'editar']); };
  return (
    <div className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <button type="button" onClick={onAbrir} className="flex-1 min-w-[150px] flex items-start gap-3 text-left group">
        <span className="w-14 shrink-0 pt-[2px] text-[13px] text-zinc-400 tabular">{f.sesion ? horaCorta(f.sesion) : '—'}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span style={vt(nombreVT)} className="text-[15px] font-medium text-ink group-hover:underline decoration-zinc-600 underline-offset-4 whitespace-nowrap">{f.c.alias}</span>
            {conDia && f.sesion && <span className="text-[12.5px] text-zinc-500">{nombreDia(f.sesion, ag.ahora)}</span>}
          </span>
          <Estados f={f} pago={pago} />
        </span>
      </button>
      <div className="flex items-center gap-0.5 ml-auto">
        {!f.preguntar && f.sesion && (
          <Icono title={f.confirmado ? 'Quitar confirmación' : 'Marcar que confirmó'} activo={f.confirmado}
            onClick={() => ag.actualizar(f.c.id, f.confirmado ? acciones.quitarConfirmo() : acciones.confirmo(f.c, f.sesion))}><Check size={16} /></Icono>
        )}
        {!f.preguntar && f.sesion && (
          <Icono title={!pago ? 'Marcar que pagó (otro toque: debe)' : pago.estado === 'pagado' ? 'Pagó · otro toque: debe' : 'Debe · otro toque: quitar'}
            activo={!!pago} tono={pago?.estado === 'pendiente' ? 'rojo' : 'verde'} onClick={() => ag.ciclarPago(f)}><Wallet size={16} /></Icono>
        )}
        {destacarAviso ? (
          <button type="button" onClick={avisar}
            className={`ml-1 h-9 px-3.5 rounded-full text-[13px] font-semibold inline-flex items-center gap-1.5 transition active:scale-[.97] ${tieneWhats ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950' : 'bg-raised ring-1 ring-line text-zinc-300 hover:text-ink'}`}>
            {tieneWhats ? <><MessageCircle size={14} /> Avisar</> : <><Plus size={14} /> WhatsApp</>}
          </button>
        ) : (
          <Icono title={tieneWhats ? 'Mandar aviso por WhatsApp' : 'Agregar su WhatsApp para avisarle'} onClick={avisar} tono="verde">
            {tieneWhats ? <MessageCircle size={16} /> : <Plus size={16} />}
          </Icono>
        )}
      </div>
    </div>
  );
}

// ---------- Pantalla principal con sus sub-pestañas ----------

export default function Agenda({ sub = 'hoy', param, extra }) {
  const ag = useAgenda();
  const { navegar } = useRuta();

  if (sub === 'personas' && param === 'nueva') return <PersonaForm ag={ag} />;
  if (sub === 'personas' && param && extra === 'editar') return <PersonaForm ag={ag} id={param} />;
  if (sub === 'personas' && param) return <PersonaDetalle ag={ag} id={param} />;
  if (sub === 'calendario' && param) return <DiaAgenda ag={ag} fecha={param} />;
  if (sub === 'asistente') return <AsistenteAgenda ag={ag} />;
  if (sub === 'google') return <GoogleCalendario ag={ag} />;

  const tabs = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'personas', label: 'Personas', cuenta: ag.lista.length },
  ];
  const activo = tabs.some((t) => t.id === sub) ? sub : 'hoy';

  return (
    <Pantalla
      grande titulo="Agenda" antetitulo={fechaLarga(ag.ahora)}
      acciones={(
        <>
          <button type="button" onClick={() => navegar(['agenda', 'asistente'])} className={btnSec}><Sparkles size={15} /> Dile qué pasó</button>
          <button type="button" onClick={() => navegar(['agenda', 'personas', 'nueva'])} className={btnPri}><Plus size={16} strokeWidth={2.5} /> Agregar persona</button>
        </>
      )}
    >
      <Subtabs items={tabs} activo={activo} onCambio={(id) => navegar(['agenda', id])} />
      {activo === 'hoy' && <VistaHoy ag={ag} />}
      {activo === 'calendario' && <VistaCalendario ag={ag} />}
      {activo === 'pagos' && <VistaPagos ag={ag} />}
      {activo === 'personas' && <VistaPersonas ag={ag} />}
    </Pantalla>
  );
}

function VistaHoy({ ag }) {
  const { navegar } = useRuta();
  const { vista, ahora } = ag;
  // Cada persona "viaja" al detalle desde su primera aparición en la pantalla (los nombres de transición no se repiten)
  const usados = new Set();
  const nombreVT = (id) => { if (usados.has(id)) return undefined; usados.add(id); return `p-${id}`; };
  const abrir = (f) => navegar(['agenda', 'personas', f.c.id]);

  const porDia = [];
  for (const f of vista.semana) {
    const k = fmtFecha(f.sesion);
    const g = porDia[porDia.length - 1];
    if (g && g.k === k) g.filas.push(f); else porDia.push({ k, d: f.sesion, filas: [f] });
  }

  const resumen = [
    { label: 'Hoy', valor: vista.hoy.length },
    { label: 'Por avisar', valor: vista.tocaAvisar.length, alerta: vista.tocaAvisar.length > 0 },
    { label: 'Próximos 7 días', valor: vista.semana.length },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {resumen.map((r) => (
          <div key={r.label} className="rounded-3xl bg-surface border border-line shadow-suave px-3.5 xs:px-5 py-4 xs:py-5">
            <dt className="text-[12px] xs:text-[13px] text-zinc-500 flex items-center gap-1.5">{r.alerta && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />}{r.label}</dt>
            <dd className={`font-display text-[34px] xs:text-[44px] leading-none mt-2 tabular ${r.alerta ? 'text-amber-300' : 'text-ink'}`}>{r.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          {vista.tocaAvisar.length > 0 && (
            <Seccion titulo={<span className="text-amber-300">Toca avisar</span>} nota="ya es hora de su aviso">
              <div className="divide-y divide-line">
                {vista.tocaAvisar.map((f) => <FilaSesion key={`a${f.c.id}`} f={f} ag={ag} conDia destacarAviso nombreVT={nombreVT(f.c.id)} onAbrir={() => abrir(f)} />)}
              </div>
            </Seccion>
          )}
          <Seccion titulo="Hoy" nota={vista.hoy.length ? `${vista.hoy.length} ${vista.hoy.length === 1 ? 'sesión' : 'sesiones'}` : null}>
            <div className="divide-y divide-line">
              {vista.hoy.length ? vista.hoy.map((f) => <FilaSesion key={`h${f.c.id}`} f={f} ag={ag} nombreVT={nombreVT(f.c.id)} onAbrir={() => abrir(f)} />) : <Vacio>Hoy no tienes sesiones.</Vacio>}
            </div>
          </Seccion>
          {vista.preguntar.length > 0 && (
            <Seccion titulo="Para preguntar" nota="sin sesión fija">
              <div className="divide-y divide-line">
                {vista.preguntar.map((f) => <FilaSesion key={`q${f.c.id}`} f={f} ag={ag} conDia nombreVT={nombreVT(f.c.id)} onAbrir={() => abrir(f)} />)}
              </div>
            </Seccion>
          )}
        </div>
        <Seccion titulo="Próximos 7 días">
          {porDia.length === 0 && <Vacio>No hay sesiones en los próximos 7 días.</Vacio>}
          {porDia.map((g) => (
            <div key={g.k}>
              <button type="button" onClick={() => navegar(['agenda', 'calendario', g.k])}
                className="px-4 pt-4 pb-1 text-[11.5px] font-medium uppercase tracking-[0.08em] text-zinc-500 hover:text-ink">{nombreDia(g.d, ahora)}</button>
              <div className="divide-y divide-line">
                {g.filas.map((f) => <FilaSesion key={`s${f.c.id}${f.clave}`} f={f} ag={ag} nombreVT={nombreVT(f.c.id)} onAbrir={() => abrir(f)} />)}
              </div>
            </div>
          ))}
        </Seccion>
      </div>
    </div>
  );
}

function VistaCalendario({ ag }) {
  const { navegar } = useRuta();
  const [mesOff, setMesOff] = useState(0);
  const base = new Date(ag.ahora.getFullYear(), ag.ahora.getMonth() + mesOff, 1);
  const anio = base.getFullYear();
  const mes = base.getMonth();
  const porDia = useMemo(() => sesionesDelMes(ag.lista, ag.pagos, anio, mes, ag.ahora), [ag.lista, ag.pagos, anio, mes, ag.ahora]);
  const celdas = [];
  for (let i = 0; i < (base.getDay() + 6) % 7; i++) celdas.push(null);
  for (let d = 1; d <= new Date(anio, mes + 1, 0).getDate(); d++) celdas.push(new Date(anio, mes, d));

  const google = getGoogle();
  return (
    <div className="space-y-4">
    <button type="button" onClick={() => navegar(['agenda', 'google'])}
      className="w-full rounded-3xl border border-line bg-surface shadow-suave px-5 py-4 flex items-center gap-3.5 text-left hover:bg-white/[0.025] transition-colors">
      <span className="w-10 h-10 shrink-0 rounded-2xl bg-raised ring-1 ring-line grid place-items-center text-emerald-300"><CalendarSync size={18} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-medium text-ink">Google Calendar</span>
        <span className="block text-[13px] text-zinc-500 truncate">{google.calendario ? `Conectado${google.ultima ? ` · última vez ${new Date(google.ultima).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}` : 'Ve tus sesiones en tu calendario'}</span>
      </span>
      <ChevronRight size={17} className="text-zinc-600 shrink-0" />
    </button>
    <Seccion
      titulo={`${mayus(MESES[mes])} ${anio}`}
      accion={(
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMesOff((m) => m - 1)} aria-label="Mes anterior" className="w-9 h-9 grid place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.05]"><ChevronLeft size={16} /></button>
          {mesOff !== 0 && <button type="button" onClick={() => setMesOff(0)} className={btnTxt}>Hoy</button>}
          <button type="button" onClick={() => setMesOff((m) => m + 1)} aria-label="Mes siguiente" className="w-9 h-9 grid place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.05]"><ChevronRight size={16} /></button>
        </div>
      )}
    >
      <div className="p-2 xs:p-3">
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="text-center text-[11px] text-zinc-500 pb-1">{d}</div>)}
          {celdas.map((d, i) => {
            if (!d) return <div key={`v${i}`} />;
            const k = fmtFecha(d);
            const filas = porDia[k] || [];
            const esHoy = k === fmtFecha(ag.ahora);
            return (
              <button key={k} type="button" onClick={() => navegar(['agenda', 'calendario', k])} aria-label={`${fechaLarga(d)}, ${filas.length} sesiones`}
                className={`min-h-[56px] sm:min-h-[84px] rounded-xl p-1.5 text-left flex flex-col transition-colors ${esHoy ? 'bg-emerald-400/[0.08] ring-1 ring-emerald-400/40' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                <span className={`text-[12px] tabular ${esHoy ? 'text-emerald-300 font-semibold' : 'text-zinc-500'}`}>{d.getDate()}</span>
                {/* En celular, puntos; en pantallas grandes, alias */}
                <span className="flex flex-wrap gap-0.5 mt-1 sm:hidden">
                  {filas.slice(0, 4).map((f) => <span key={`${f.c.id}${f.clave}`} className={`w-1.5 h-1.5 rounded-full ${puntoDe(estadoDe(f))}`} />)}
                </span>
                <span className="hidden sm:block mt-0.5 space-y-0.5 min-w-0 w-full">
                  {filas.slice(0, 3).map((f) => (
                    <span key={`${f.c.id}${f.clave}`} className="flex items-center gap-1.5 text-[11.5px] text-zinc-300 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${puntoDe(estadoDe(f))}`} /><span className="truncate">{f.c.alias}</span>
                    </span>
                  ))}
                  {filas.length > 3 && <span className="block text-[11px] text-zinc-500">+{filas.length - 3}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 px-1">{ESTADOS.map((e) => <Chip key={e.id} punto={e.punto}>{e.label}</Chip>)}</div>
      </div>
    </Seccion>
    </div>
  );
}

function DiaAgenda({ ag, fecha }) {
  const { navegar } = useRuta();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha || '');
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : ag.ahora;
  const filas = (sesionesDelMes(ag.lista, ag.pagos, d.getFullYear(), d.getMonth(), ag.ahora)[fmtFecha(d)]) || [];
  const usados = new Set();
  return (
    <Pantalla atras={['agenda', 'calendario']} etiquetaAtras="Calendario" titulo={fechaLarga(d)} subtitulo={`${filas.length} ${filas.length === 1 ? 'sesión' : 'sesiones'}`}>
      <Seccion>
        <div className="divide-y divide-line">
          {filas.length === 0 && <Vacio>No hay sesiones este día.</Vacio>}
          {filas.map((f) => {
            const nombre = usados.has(f.c.id) ? undefined : `p-${f.c.id}`;
            usados.add(f.c.id);
            return f.pasada ? (
              <FilaEnlace key={`${f.c.id}${f.clave}`} onClick={() => navegar(['agenda', 'personas', f.c.id])}
                derecha={<Chip punto={puntoDe(estadoDe(f))}>{ESTADOS.find((e) => e.id === estadoDe(f))?.label}</Chip>}>
                <span className="flex items-baseline gap-3"><span className="w-14 text-[13px] text-zinc-400 tabular">{horaCorta(f.sesion)}</span><span style={vt(nombre)} className="text-[15px] font-medium text-ink">{f.c.alias}</span></span>
              </FilaEnlace>
            ) : (
              <FilaSesion key={`${f.c.id}${f.clave}`} f={{ ...f, avisado: f.c.avisado_sesion === f.clave }} ag={ag} nombreVT={nombre} onAbrir={() => navegar(['agenda', 'personas', f.c.id])} />
            );
          })}
        </div>
      </Seccion>
    </Pantalla>
  );
}

function VistaPagos({ ag }) {
  const { navegar } = useRuta();
  const [semOff, setSemOff] = useState(0);
  const [editMonto, setEditMonto] = useState(null);
  const hoy0 = new Date(ag.ahora.getFullYear(), ag.ahora.getMonth(), ag.ahora.getDate());
  const lunes = addDias(hoy0, -((hoy0.getDay() + 6) % 7) + semOff * 7);
  const domingo = addDias(lunes, 6);
  const dentro = ag.pagos.map((p) => ({ p, f: parseFechaHora(p.sesion) })).filter(({ f }) => f && f >= lunes && f < addDias(lunes, 7)).sort((a, b) => a.f - b.f);
  const pagaron = dentro.filter(({ p }) => p.estado === 'pagado');
  const deben = dentro.filter(({ p }) => p.estado === 'pendiente');
  const total = pagaron.reduce((a, { p }) => a + (p.monto ?? ag.precio), 0);
  const rango = `${lunes.getDate()} ${MES3[lunes.getMonth()]} – ${domingo.getDate()} ${MES3[domingo.getMonth()]}`;
  const alias = (id) => ag.persona(id)?.alias || '—';
  const guardarMonto = () => {
    const v = parseFloat(String(editMonto.valor).replace(',', '.'));
    ag.setPagos(ag.pagos.map((x) => (x.id === editMonto.id ? { ...x, monto: Number.isFinite(v) && v > 0 ? v : null } : x)));
    setEditMonto(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[48px] xs:text-[56px] leading-none text-ink tabular">{total.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</span>
            <span className="text-[14px] text-zinc-500">pesos</span>
          </div>
          <p className="text-[13px] text-zinc-500 mt-2 tabular">{pagaron.length} {pagaron.length === 1 ? 'pagó' : 'pagaron'} · {deben.length} {deben.length === 1 ? 'debe' : 'deben'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setSemOff((s) => s - 1)} aria-label="Semana anterior" className="w-9 h-9 grid place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.05]"><ChevronLeft size={16} /></button>
          <span className="text-[13px] text-zinc-300 tabular min-w-[120px] text-center">{semOff === 0 ? 'Esta semana' : rango}</span>
          <button type="button" onClick={() => setSemOff((s) => Math.min(0, s + 1))} disabled={semOff === 0} aria-label="Semana siguiente" className="w-9 h-9 grid place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.05] disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>

      <Seccion>
        <div className="divide-y divide-line">
          {dentro.length === 0 && <Vacio>No hay pagos registrados esta semana. Márcalos con el botón de cartera en cada sesión.</Vacio>}
          {[...pagaron, ...deben].map(({ p, f }) => (
            <div key={p.id} className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button type="button" onClick={() => navegar(['agenda', 'personas', p.cliente_id])} className="flex-1 min-w-0 text-left">
                <span className="block text-[15px] font-medium text-ink truncate">{alias(p.cliente_id)}</span>
                <span className="block text-[12.5px] text-zinc-500 tabular">{DIAS[f.getDay()]} {f.getDate()} {MES3[f.getMonth()]} · {horaCorta(f)}</span>
              </button>
              {p.estado === 'pagado' && (editMonto?.id === p.id ? (
                <input autoFocus inputMode="decimal" aria-label="Monto" value={editMonto.valor}
                  onChange={(e) => setEditMonto({ ...editMonto, valor: e.target.value.replace(/[^0-9.,]/g, '') })}
                  onBlur={guardarMonto} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditMonto(null); }}
                  className="w-28 h-9 rounded-xl bg-raised border border-line outline-none px-3 text-right text-[14px] text-ink tabular" />
              ) : (
                <button type="button" title="Toca para poner cuánto aportó" onClick={() => setEditMonto({ id: p.id, valor: p.monto != null ? String(p.monto) : '' })}
                  className={`h-9 px-3 rounded-xl text-[13px] tabular ${p.monto != null ? 'text-ink bg-raised' : 'text-zinc-500 border border-dashed border-line'}`}>
                  {p.monto != null ? pesos(p.monto) : ag.precio > 0 ? `${pesos(ag.precio)}*` : 'poner monto'}
                </button>
              ))}
              <span className={`w-10 text-right text-[13px] ${p.estado === 'pagado' ? 'text-emerald-300' : 'text-rose-300'}`}>{p.estado === 'pagado' ? 'pagó' : 'debe'}</span>
            </div>
          ))}
        </div>
      </Seccion>

      <Campo etiqueta="Precio por sesión (se usa cuando no pones monto)" className="max-w-xs">
        <input value={ag.ajustes.precio} inputMode="decimal" placeholder="pesos" onChange={(e) => ag.setAjustes({ ...ag.ajustes, precio: e.target.value.replace(/[^0-9.]/g, '') })} className={inp} />
      </Campo>
    </div>
  );
}

function VistaPersonas({ ag }) {
  const { navegar } = useRuta();
  return (
    <div className="space-y-6 max-w-2xl">
      <Seccion>
        <div className="divide-y divide-line">
          {ag.lista.length === 0 && <Vacio>Todavía no hay nadie. Usa “Agregar persona”.</Vacio>}
          {ag.vista.filas.map((f) => (
            <FilaEnlace key={f.c.id} onClick={() => navegar(['agenda', 'personas', f.c.id])}
              derecha={<span className="text-[13px] text-zinc-500 tabular text-right">{f.preguntar ? 'preguntar' : f.sesion ? `${nombreDia(f.sesion, ag.ahora)} · ${horaCorta(f.sesion)}` : 'sin sesión'}</span>}>
              <span style={vt(`p-${f.c.id}`)} className={`text-[15px] font-medium ${f.activo ? 'text-ink' : 'text-zinc-600 line-through'}`}>{f.c.alias}</span>
            </FilaEnlace>
          ))}
        </div>
      </Seccion>
      <Seccion titulo="Mensaje de aviso">
        <div className="p-4 space-y-2">
          <textarea aria-label="Mensaje de aviso" rows={3} value={ag.ajustes.mensaje} onChange={(e) => ag.setAjustes({ ...ag.ajustes, mensaje: e.target.value })} className={area} />
          <p className="text-[12.5px] text-zinc-500">
            Se llena solo con <code className="text-zinc-300">{'{dia}'}</code>, <code className="text-zinc-300">{'{hora_art}'}</code> y <code className="text-zinc-300">{'{fecha}'}</code>.
            {ag.ajustes.mensaje !== MENSAJE_BASE && <button type="button" onClick={() => ag.setAjustes({ ...ag.ajustes, mensaje: MENSAJE_BASE })} className="ml-2 text-emerald-300 hover:underline">Restaurar</button>}
          </p>
        </div>
      </Seccion>
      <p className="flex items-center gap-2 text-[12.5px] text-zinc-500"><ShieldCheck size={14} className="text-emerald-300" /> Usa alias o códigos (C-01), no nombres completos.</p>
    </div>
  );
}

// ---------- Detalle de una persona ----------

function PersonaDetalle({ ag, id }) {
  const { navegar } = useRuta();
  const [mover, setMover] = useState(null);
  const c = ag.persona(id);
  const f = ag.filaDe(id);
  if (!c || !f) {
    return <Pantalla atras={['agenda', 'personas']} etiquetaAtras="Personas" titulo="No encontrada"><Vacio>Esta persona ya no está en la lista.</Vacio></Pantalla>;
  }
  const pago = f.clave ? ag.pagoDe(f) : null;
  const siguientes = f.activo && !f.preguntar ? proximasSesiones(c, new Date(ag.ahora.getTime() - 3600000), 5).slice(1) : [];
  const susPagos = ag.pagos.filter((p) => p.cliente_id === id).map((p) => ({ p, d: parseFechaHora(p.sesion) })).filter((x) => x.d).sort((a, b) => b.d - a.d);
  const frecuencia = { 0: 'Una sola vez', 7: 'Cada semana', 14: 'Cada dos semanas', 28: 'Cada cuatro semanas' }[parseInt(c.frecuencia_dias, 10)] || `Cada ${c.frecuencia_dias} días`;

  return (
    <Pantalla
      atras={['agenda', 'personas']} etiquetaAtras="Agenda" titulo={c.alias} tituloVT={`p-${id}`}
      subtitulo={f.preguntar ? 'Sin sesión fija' : f.sesion ? `Próxima: ${nombreDia(f.sesion, ag.ahora)} · ${horaCorta(f.sesion)}` : 'Sin próxima sesión'}
      acciones={<button type="button" onClick={() => navegar(['agenda', 'personas', id, 'editar'])} className={btnSec}><Pencil size={15} /> Editar</button>}
      ancho="max-w-2xl"
    >
      <div className="space-y-6">
        <Seccion titulo={f.preguntar ? 'Por agendar' : 'Próxima sesión'}>
          <div className="p-4 space-y-4">
            {f.sesion && <Estados f={f} pago={pago} />}
            <div className="flex flex-wrap gap-2">
              {!f.preguntar && f.sesion && (
                <button type="button" onClick={() => ag.actualizar(id, f.confirmado ? acciones.quitarConfirmo() : acciones.confirmo(c, f.sesion))}
                  className={f.confirmado ? `${btnSec} !text-fuchsia-200 !bg-fuchsia-400/15` : btnSec}><Check size={16} /> {f.confirmado ? 'Confirmó' : 'Marcar confirmó'}</button>
              )}
              {!f.preguntar && f.sesion && (
                <button type="button" onClick={() => ag.ciclarPago(f)}
                  className={pago ? `${btnSec} ${pago.estado === 'pagado' ? '!text-emerald-200 !bg-emerald-400/15' : '!text-rose-200 !bg-rose-400/15'}` : btnSec}>
                  <Wallet size={16} /> {!pago ? 'Marcar pago' : pago.estado === 'pagado' ? 'Pagó' : 'Debe'}
                </button>
              )}
              {numeroWhatsApp(c.telefono)
                ? <button type="button" onClick={() => ag.avisar(f)} className={btnPri}><MessageCircle size={16} /> Avisar por WhatsApp</button>
                : <button type="button" onClick={() => navegar(['agenda', 'personas', id, 'editar'])} className={btnPri}><Plus size={16} /> Agregar WhatsApp</button>}
              <button type="button" onClick={() => ag.copiarAviso(f)} className={btnSec}>
                {ag.copiado === id ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar mensaje</>}
              </button>
              <button type="button" onClick={() => setMover(mover ? null : { fecha: fmtFecha(f.sesion || ag.ahora), hora: f.sesion ? fmtHora(f.sesion) : '12:00' })} className={btnSec}>
                <CalendarClock size={16} /> {f.preguntar ? 'Agendar' : 'Mover'}
              </button>
              {!f.preguntar && f.sesion && (
                <button type="button" onClick={() => ag.actualizar(id, acciones.noViene(c, new Date(ag.ahora.getTime() - 3600000)))} className={btnSec}><CalendarX size={16} /> No viene</button>
              )}
            </div>
            {mover && (
              <div className="flex flex-wrap items-end gap-2 pt-1">
                <Campo etiqueta="Fecha"><input type="date" value={mover.fecha} onChange={(e) => setMover({ ...mover, fecha: e.target.value })} className={`${inp} w-auto`} /></Campo>
                <Campo etiqueta="Hora"><input type="time" value={mover.hora} onChange={(e) => setMover({ ...mover, hora: e.target.value })} className={`${inp} w-auto`} /></Campo>
                <button type="button" disabled={!mover.fecha || !mover.hora} onClick={() => { ag.actualizar(id, acciones.soloEstaVez(c, mover.fecha, mover.hora)); setMover(null); }} className={btnPri}>Solo esta vez</button>
                {!f.preguntar && <button type="button" disabled={!mover.fecha || !mover.hora} onClick={() => { ag.actualizar(id, acciones.cambiarHorario(c, mover.fecha, mover.hora)); setMover(null); }} className={btnSec}>Cambiar horario fijo</button>}
              </div>
            )}
          </div>
        </Seccion>

        {siguientes.length > 0 && (
          <Seccion titulo="Siguientes sesiones">
            <ul className="divide-y divide-line">
              {siguientes.map((s) => <li key={fmtFechaHora(s)} className="px-4 py-3 text-[14px] text-zinc-300 tabular">{nombreDia(s, ag.ahora)} · {horaCorta(s)}</li>)}
            </ul>
          </Seccion>
        )}

        <Seccion titulo="Pagos" nota={susPagos.length ? `${susPagos.length}` : null}>
          <ul className="divide-y divide-line">
            {susPagos.length === 0 && <Vacio>Sin pagos registrados.</Vacio>}
            {susPagos.map(({ p, d }) => (
              <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3 text-[14px]">
                <span className="text-zinc-300 tabular">{d.getDate()} {MES3[d.getMonth()]} · {horaCorta(d)}</span>
                <span className={p.estado === 'pagado' ? 'text-emerald-300' : 'text-rose-300'}>{p.estado === 'pagado' ? (p.monto != null ? pesos(p.monto) : 'pagó') : 'debe'}</span>
              </li>
            ))}
          </ul>
        </Seccion>

        <Seccion titulo="Datos">
          <dl className="divide-y divide-line text-[14px]">
            {[['Tipo', f.preguntar ? 'Sin sesión fija' : 'Sesión fija'], ['Frecuencia', f.preguntar ? '—' : frecuencia], ['WhatsApp', c.telefono || 'Sin número'], ['Estado', c.activo === false ? 'Inactiva' : 'Activa']].map(([k, v]) => (
              <div key={k} className="px-4 py-3 flex justify-between gap-4"><dt className="text-zinc-500">{k}</dt><dd className="text-zinc-200 text-right">{v}</dd></div>
            ))}
          </dl>
        </Seccion>
      </div>
    </Pantalla>
  );
}

// ---------- Agregar / editar persona ----------

const VACIA = { alias: '', telefono: '', proxima_sesion: '', hora_sesion: '17:00', frecuencia_dias: 7, modo: 'fijo', activo: true };

function PersonaForm({ ag, id }) {
  const { navegar, atras } = useRuta();
  const existente = id ? ag.persona(id) : null;
  const [form, setForm] = useState(() => (existente ? { ...VACIA, ...existente } : { ...VACIA, proxima_sesion: fmtFecha(ag.ahora) }));
  const [borrando, setBorrando] = useState(false);
  const listo = form.alias.trim().length > 0 && (form.modo === 'preguntar' || (form.proxima_sesion && form.hora_sesion));

  const guardar = (e) => {
    e.preventDefault();
    if (!listo) return;
    const nuevo = ag.guardarPersona(form);
    if (existente) atras(['agenda', 'personas', id]);
    else navegar(['agenda', 'personas', nuevo], { reemplazar: true });
  };

  return (
    <Pantalla atras={existente ? ['agenda', 'personas', id] : ['agenda', 'personas']} etiquetaAtras={existente ? existente.alias : 'Agenda'}
      titulo={existente ? 'Editar persona' : 'Agregar persona'} ancho="max-w-2xl">
      <form onSubmit={guardar} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo etiqueta="Alias o código" ayuda="No uses el nombre completo."><input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="C-06" className={inp} /></Campo>
          <Campo etiqueta="WhatsApp" ayuda={form.telefono && !numeroWhatsApp(form.telefono) ? 'Revisa el número: 10 dígitos (México) o con lada de país.' : 'Para mandarle el aviso con un botón. 10 dígitos (México) o con lada de país.'}>
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} inputMode="tel" autoComplete="off" autoFocus={!!existente && !numeroWhatsApp(existente.telefono)} placeholder="81 0000 0000" className={inp} />
          </Campo>
          <Campo etiqueta="Tipo" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {[['fijo', 'Sesión fija'], ['preguntar', 'Sin sesión fija (preguntar)']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setForm({ ...form, modo: v })}
                  className={`h-10 px-4 rounded-xl text-[14px] transition-colors ${form.modo === v ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/50' : 'bg-raised text-zinc-400'}`}>{l}</button>
              ))}
            </div>
          </Campo>
          {form.modo === 'fijo' && (
            <>
              <Campo etiqueta="Próxima sesión"><input type="date" value={form.proxima_sesion} onChange={(e) => setForm({ ...form, proxima_sesion: e.target.value })} className={inp} /></Campo>
              <Campo etiqueta="Hora"><input type="time" value={form.hora_sesion} onChange={(e) => setForm({ ...form, hora_sesion: e.target.value })} className={inp} /></Campo>
              <Campo etiqueta="Frecuencia" className="sm:col-span-2">
                <select value={form.frecuencia_dias} onChange={(e) => setForm({ ...form, frecuencia_dias: e.target.value })} className={inp}>
                  <option value={7}>Cada semana</option><option value={14}>Cada dos semanas</option><option value={28}>Cada cuatro semanas</option><option value={0}>Una sola vez</option>
                </select>
              </Campo>
            </>
          )}
          {existente && (
            <label className="flex items-center gap-3 text-[14px] text-zinc-300 sm:col-span-2">
              <input type="checkbox" checked={form.activo !== false} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="accent-emerald-400 w-4 h-4" /> Activa en la agenda
            </label>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={!listo} className={btnPri}>Guardar</button>
          <button type="button" onClick={() => atras()} className={btnTxt}>Cancelar</button>
        </div>
        {existente && (borrando ? (
          <Confirmar pregunta={`¿Quitar a ${existente.alias} de la agenda? También se borran sus pagos registrados.`}
            onSi={() => { ag.borrarPersona(id); navegar(['agenda', 'personas'], { reemplazar: true }); }} onNo={() => setBorrando(false)} />
        ) : (
          <button type="button" onClick={() => setBorrando(true)} className="text-[13.5px] text-rose-300/80 hover:text-rose-300">Quitar de la agenda</button>
        ))}
      </form>
    </Pantalla>
  );
}

// ---------- Asistente de la agenda: "dile qué pasó" ----------
// La IA solo recibe alias, horarios y pagos (nunca teléfonos ni notas). Propone cambios; tú los aplicas.

const conDia = (d) => `${fmtFechaHora(d)} (${DIAS[d.getDay()]})`;
const bonita = (d) => `${DIAS[d.getDay()]} ${d.getDate()} ${MES3[d.getMonth()]} · ${horaCorta(d)}`;

function contextoAgenda(ag) {
  const base = new Date(ag.ahora.getTime() - 3600000);
  const lineas = ['PERSONAS:'];
  ag.lista.forEach((c, i) => {
    const f = ag.filaDe(c.id);
    const partes = [`n=${i + 1}`, c.alias];
    if (c.activo === false) { lineas.push(`${partes.join(' | ')} | inactiva`); return; }
    if (c.modo === 'preguntar') partes.push('sin sesión fija');
    else {
      const frec = parseInt(c.frecuencia_dias, 10) || 0;
      partes.push(frec ? `cada ${frec} días` : 'sesión única');
      partes.push(f?.sesion ? `próxima: ${conDia(f.sesion)} ${f.confirmado ? '[confirmó]' : '[sin confirmar]'}` : 'sin próxima sesión');
      if (frec && f?.sesion) {
        const ant = addDias(f.sesion, -frec);
        if (ant < base) {
          const p = ag.pagos.find((x) => x.cliente_id === c.id && x.sesion === fmtFechaHora(ant));
          partes.push(`anterior: ${conDia(ant)}${p ? (p.estado === 'pagado' ? ' [pagó]' : ' [debe]') : ''}`);
        }
      }
    }
    lineas.push(partes.join(' | '));
  });
  const agenda = [];
  ag.lista.forEach((c) => {
    if (c.activo === false || c.modo === 'preguntar') return;
    proximasSesiones(c, base, 3).forEach((s) => { if (s - ag.ahora < 14 * 86400000) agenda.push([s, c]); });
  });
  agenda.sort((x, y) => x[0] - y[0]);
  lineas.push('', 'AGENDA PRÓXIMOS 14 DÍAS (cada sesión dura 1 hora; toda sesión agendada ocupa su hora):');
  agenda.forEach(([s, c]) => lineas.push(`${conDia(s)} — ${c.alias}`));
  const deben = ag.pagos.filter((p) => p.estado === 'pendiente').map((p) => `${ag.persona(p.cliente_id)?.alias || '?'} debe la sesión del ${p.sesion}`);
  lineas.push('', 'PAGOS PENDIENTES:', ...(deben.length ? deben : ['ninguno']));
  return lineas.join('\n');
}

const SISTEMA_AGENDA = `Eres el asistente de la agenda de una psicoterapeuta. Hablas en español de México, breve y amable.
Ella te dice cosas como "C-02 confirmó", "C-03 no viene esta semana", "mueve a C-04 al viernes a las 5", "C-01 pagó", o te pregunta "¿a quién veo mañana?", "¿quién me debe?", "¿tengo hueco el jueves en la tarde?".
Usa SOLO los datos del CONTEXTO. Si algo no está ahí o falta un dato (quién, día u hora), pregúntalo y no propongas cambios.
Nunca empalmes: una sola persona por hora. Si piden mover a alguien a una hora ocupada, avísalo y sugiere horas libres.
Para cambios de una sola semana (vacaciones, días festivos) usa "solo_esta_vez", no "cambiar_horario".

Responde SOLO con un objeto JSON, sin texto antes ni después:
{"respuesta": "texto corto", "cambios": [ ... ]}
Cada cambio es uno de estos (n = número de la persona en el contexto):
{"tipo": "confirmo", "n": 3}
{"tipo": "quitar_confirmo", "n": 3}
{"tipo": "no_viene", "n": 3}
{"tipo": "solo_esta_vez", "n": 3, "fecha": "AAAA-MM-DD", "hora": "HH:MM"}
{"tipo": "cambiar_horario", "n": 3, "fecha": "AAAA-MM-DD", "hora": "HH:MM"}
{"tipo": "pago", "n": 3, "estado": "pagado" o "pendiente", "sesion": "AAAA-MM-DD HH:MM"}
{"tipo": "nuevo", "alias": "C-07", "fecha": "AAAA-MM-DD", "hora": "HH:MM", "frecuencia_dias": 7}
Si solo te preguntan algo, "cambios" va vacío.`;

/** Saca el objeto JSON de la respuesta del modelo, aunque venga con texto alrededor. */
function leerRespuesta(texto) {
  const i = texto.indexOf('{');
  const j = texto.lastIndexOf('}');
  if (i >= 0 && j > i) {
    try {
      const o = JSON.parse(texto.slice(i, j + 1));
      return { respuesta: String(o.respuesta || ''), cambios: Array.isArray(o.cambios) ? o.cambios : [] };
    } catch (_) { /* sigue abajo */ }
  }
  return { respuesta: texto.trim(), cambios: [] };
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{1,2}:\d{2}$/;

function describir(cambio, ag) {
  const c = cambio.n ? ag.lista[cambio.n - 1] : null;
  const quien = c?.alias || '¿?';
  const cuando = (f, h) => { const d = parseFechaHora(`${f} ${String(h).padStart(5, '0')}`); return d ? bonita(d) : `${f} ${h}`; };
  switch (cambio.tipo) {
    case 'confirmo': return `${quien} confirmó su próxima sesión`;
    case 'quitar_confirmo': return `Quitar la confirmación de ${quien}`;
    case 'no_viene': return `${quien} no viene: se salta su próxima sesión`;
    case 'solo_esta_vez': return `Mover a ${quien} solo esta vez al ${cuando(cambio.fecha, cambio.hora)}`;
    case 'cambiar_horario': return `Cambiar el horario fijo de ${quien} desde el ${cuando(cambio.fecha, cambio.hora)}`;
    case 'pago': return `${quien} ${cambio.estado === 'pendiente' ? 'debe' : 'pagó'} la sesión del ${cambio.sesion}`;
    case 'nuevo': return `Agregar a ${cambio.alias}: ${cuando(cambio.fecha, cambio.hora)}${cambio.frecuencia_dias ? `, cada ${cambio.frecuencia_dias} días` : ''}`;
    default: return null;
  }
}

/** Aplica todos los cambios de una vez (para que ninguno pise a otro). */
function aplicarCambios(cambios, ag) {
  let lista = [...ag.lista];
  let pagos = [...ag.pagos];
  const corte = new Date(ag.ahora.getTime() - 3600000);
  const cambiar = (id, campos) => { if (campos && !campos.error) lista = lista.map((c) => (c.id === id ? { ...c, ...campos } : c)); };
  for (const k of cambios) {
    if (k.tipo === 'nuevo') {
      if (!k.alias || !FECHA.test(k.fecha || '') || !HORA.test(k.hora || '')) continue;
      lista.push({ id: nuevoId(), alias: String(k.alias).slice(0, 30), telefono: '', proxima_sesion: k.fecha, hora_sesion: k.hora.padStart(5, '0'), frecuencia_dias: parseInt(k.frecuencia_dias, 10) || 0, modo: 'fijo', activo: true });
      continue;
    }
    const c = lista[k.n - 1];
    if (!c) continue;
    const f = ag.filaDe(c.id);
    if (k.tipo === 'confirmo' && f?.sesion) cambiar(c.id, acciones.confirmo(c, f.sesion));
    if (k.tipo === 'quitar_confirmo') cambiar(c.id, acciones.quitarConfirmo());
    if (k.tipo === 'no_viene') cambiar(c.id, acciones.noViene(c, corte));
    if ((k.tipo === 'solo_esta_vez' || k.tipo === 'cambiar_horario') && FECHA.test(k.fecha || '') && HORA.test(k.hora || '')) {
      cambiar(c.id, acciones[k.tipo === 'solo_esta_vez' ? 'soloEstaVez' : 'cambiarHorario'](c, k.fecha, k.hora.padStart(5, '0')));
    }
    if (k.tipo === 'pago' && parseFechaHora(k.sesion || '')) {
      const estado = k.estado === 'pendiente' ? 'pendiente' : 'pagado';
      const existe = pagos.find((p) => p.cliente_id === c.id && p.sesion === k.sesion);
      pagos = existe ? pagos.map((p) => (p === existe ? { ...p, estado } : p)) : [...pagos, { id: nuevoId(), cliente_id: c.id, sesion: k.sesion, estado, monto: ag.precio || null }];
    }
  }
  ag.setLista(lista);
  ag.setPagos(pagos);
}

const SUGERENCIAS = ['¿A quién veo mañana?', '¿Quién me debe?', '¿Qué huecos tengo esta semana por la tarde?'];

/** Conexión con Google Calendar: un calendario propio con las sesiones de las próximas cuatro semanas. */
function GoogleCalendario({ ag }) {
  const aviso = useAviso();
  const [g, setG] = useState(getGoogle);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const cuantas = sesionesParaCalendario(ag.lista, ag.ahora).length;

  const sinc = async () => {
    setError('');
    setTrabajando(true);
    try {
      const r = await sincronizar(ag.lista, ag.ahora);
      setG(getGoogle());
      aviso(r.puestas || r.quitadas ? `Listo: ${r.puestas} agregadas, ${r.quitadas} quitadas` : 'Tu calendario ya estaba al día');
    } catch (e) {
      setError(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Pantalla atras={['agenda', 'calendario']} etiquetaAtras="Calendario" titulo="Google Calendar" ancho="max-w-xl">
      <div className="space-y-5">
        <Seccion>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${g.calendario ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <p className="text-[15px] text-ink">{g.calendario ? 'Conectado' : 'Sin conectar'}</p>
              {g.ultima && <p className="text-[13px] text-zinc-500 ml-auto">{new Date(g.ultima).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
            </div>
            <p className="text-[14px] text-zinc-400 leading-relaxed">
              Se crea un calendario aparte, <span className="text-ink">sesiones</span>, con tus {cuantas} sesiones de las próximas cuatro semanas. Cada evento lleva solo el alias (como C-01), sin nombres ni teléfonos.
            </p>
            {!CLIENT_ID ? (
              <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-[13.5px] text-amber-200 leading-relaxed">
                Falta un dato para conectar: el Client ID de Google (<code>VITE_GOOGLE_CLIENT_ID</code> en Railway). Los pasos están en la guía, en "Conectar Google Calendar".
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={sinc} disabled={trabajando} className={btnPri}>
                  {g.calendario ? <RefreshCw size={16} className={trabajando ? 'animate-spin' : ''} /> : <CalendarSync size={16} />}
                  {trabajando ? 'Sincronizando…' : g.calendario ? 'Sincronizar ahora' : 'Conectar con Google'}
                </button>
                {g.calendario && <button type="button" onClick={() => { desconectar(); setG({}); aviso('Desconectado'); }} className={btnSec}><Unplug size={16} /> Desconectar</button>}
              </div>
            )}
            {error && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-[13.5px] text-rose-200">{error}</p>}
          </div>
        </Seccion>
        <p className="text-[12.5px] text-zinc-500 leading-relaxed px-1">
          Cuando cambies algo en tu agenda, vuelve aquí y toca <span className="text-zinc-300">Sincronizar ahora</span>. La app solo puede ver y cambiar el calendario que ella creó, no tus otros calendarios.
        </p>
      </div>
    </Pantalla>
  );
}

function AsistenteAgenda({ ag }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState(null);
  React.useEffect(() => { estadoIA().then(setEstado); }, []);
  const conectado = estado?.servidor && estado?.conectada;

  const enviar = async (contenido = texto) => {
    const pregunta = contenido.trim();
    if (!pregunta || pensando) return;
    setError('');
    const conPregunta = [...mensajes, { role: 'user', content: pregunta }];
    setMensajes(conPregunta);
    setTexto('');
    setPensando(true);
    try {
      const crudo = await preguntarIA({
        sistema: `${SISTEMA_AGENDA}\n\nAHORA: ${conDia(ag.ahora)}\n\nCONTEXTO:\n${contextoAgenda(ag)}`,
        mensajes: conPregunta.slice(-8).map((m) => ({ role: m.role, content: m.role === 'assistant' ? m.respuesta : m.content })),
        clave: claveGuardada(),
      });
      const { respuesta, cambios } = leerRespuesta(crudo);
      const validos = cambios.filter((k) => describir(k, ag));
      setMensajes([...conPregunta, { role: 'assistant', respuesta, cambios: validos, aplicado: false }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setPensando(false);
    }
  };

  const aplicar = (i) => {
    aplicarCambios(mensajes[i].cambios, ag);
    setMensajes(mensajes.map((m, k) => (k === i ? { ...m, aplicado: true } : m)));
  };

  return (
    <Pantalla atras={['agenda', 'hoy']} etiquetaAtras="Agenda" titulo="Dile qué pasó" ancho="max-w-2xl"
      subtitulo={conectado ? 'Te propongo los cambios; tú decides si se aplican.' : 'Conecta Cloudflare para usar el asistente de la agenda (ver guía).'}>
      <div className="space-y-5">
        {mensajes.length === 0 && (
          <div className="space-y-3">
            <p className="text-[15px] text-zinc-400">Escribe como hablas: “C-02 confirmó y pagó”, “C-03 no viene esta semana”, “mueve a C-04 al jueves a las 5”.</p>
            <div className="flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => <button key={s} type="button" disabled={!conectado} onClick={() => enviar(s)} className="h-9 px-3.5 rounded-full text-[13px] text-zinc-300 bg-raised hover:text-ink disabled:opacity-40">{s}</button>)}
            </div>
          </div>
        )}
        {mensajes.map((m, i) => (m.role === 'user' ? (
          <div key={i} className="flex justify-end animate-entrada"><p className="max-w-[85%] rounded-2xl bg-raised px-4 py-2.5 text-[15px] text-ink whitespace-pre-wrap">{m.content}</p></div>
        ) : (
          <div key={i} className="space-y-3 animate-entrada">
            {m.respuesta && <p className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap">{m.respuesta}</p>}
            {m.cambios.length > 0 && (
              <Seccion titulo={m.aplicado ? 'Cambios aplicados' : 'Cambios propuestos'}>
                <ul className="divide-y divide-line">
                  {m.cambios.map((k, j) => (
                    <li key={j} className="px-4 py-3 flex items-center gap-3 text-[14px] text-zinc-200">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.aplicado ? 'bg-emerald-400' : 'bg-sky-400'}`} />{describir(k, ag)}
                    </li>
                  ))}
                </ul>
                {!m.aplicado && (
                  <div className="px-4 pb-4 pt-1"><button type="button" onClick={() => aplicar(i)} className={btnPri}><Check size={16} /> Aplicar {m.cambios.length === 1 ? 'cambio' : `${m.cambios.length} cambios`}</button></div>
                )}
              </Seccion>
            )}
          </div>
        )))}
        {pensando && <p className="text-[14px] text-zinc-500 animate-pulse">Revisando tu agenda…</p>}
        {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-[13.5px] text-rose-200">{error}</p>}
        <div className="flex items-end gap-2 pt-2">
          <textarea rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Qué pasó"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder={conectado ? 'Ej. C-02 confirmó y C-05 no viene' : 'El asistente no está conectado'} disabled={!conectado}
            className="flex-1 min-w-0 rounded-xl bg-raised border border-line focus:border-emerald-400/60 outline-none p-3 text-[15px] text-ink resize-none disabled:opacity-50" />
          <button type="button" onClick={() => enviar()} disabled={!conectado || !texto.trim() || pensando} aria-label="Enviar"
            className="w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-emerald-400 text-emerald-950 disabled:opacity-40"><ArrowUp size={18} /></button>
        </div>
        <p className="flex items-center gap-2 text-[12.5px] text-zinc-500"><ShieldCheck size={14} className="text-emerald-300" /> Al asistente solo le llegan alias, horarios y pagos; nunca teléfonos ni notas.</p>
      </div>
    </Pantalla>
  );
}
