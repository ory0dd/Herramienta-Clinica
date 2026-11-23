import React, { useEffect, useState } from 'react';
import { Copy, Check, RefreshCw, AlertTriangle, UserPlus, Sparkles, FolderPlus, FolderOpen, FileSignature } from 'lucide-react';
import { addPatient } from '../../utils/storage';
import { ConstanciaConsentimiento, BotonImprimir, AudioConsentimiento } from '../Documento';
import { hayNube } from '../../utils/nube';
import { cargarPortal, contestadas } from '../../utils/portal';
import { SECCIONES_ENTREVISTA, PREGUNTAS_ENTREVISTA } from '../../data/entrevista';
import { useRuta, vt } from '../rutas';
import { Pantalla, Seccion, FilaEnlace, Vacio, Campo, inp, btnPri, btnSec } from '../ui';

const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// Lo último que se trajo de Supabase, para que al ir y venir entre pantallas no parpadee
let cache = null;

function usePortal(activo) {
  const [datos, setDatos] = useState(cache);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const cargar = async () => {
    setCargando(true);
    setError('');
    try { cache = await cargarPortal(); setDatos(cache); } catch (e) { setError(e.message); } finally { setCargando(false); }
  };
  useEffect(() => { if (activo) cargar(); }, [activo]); // eslint-disable-line react-hooks/exhaustive-deps
  return { datos, cargando, error, cargar, setDatos };
}

const estadoDe = (x) => {
  const n = contestadas(x.entrevista?.respuestas);
  if (x.entrevista?.completada) return ['Enviada', 'bg-emerald-400'];
  if (n > 0) return [`En progreso · ${n}/${PREGUNTAS_ENTREVISTA.length}`, 'bg-sky-400'];
  return ['Sin empezar', 'bg-zinc-600'];
};

export default function Entrevistas({ id, sub, therapist, patients = [], onCambio, onAbrirAsistente }) {
  const enNube = hayNube && therapist?.nube;
  const portal = usePortal(enNube);
  if (!hayNube || !enNube) return <SinConexion conectada={hayNube} />;
  if (id === 'invitar') return <Invitar portal={portal} />;
  if (id && sub === 'constancia') return <Constancia portal={portal} id={id} />;
  if (id) return <EntrevistaDetalle portal={portal} id={id} patients={patients} onCambio={onCambio} onAbrirAsistente={onAbrirAsistente} />;
  return <ListaEntrevistas portal={portal} />;
}

function SinConexion({ conectada }) {
  return (
    <Pantalla grande titulo="Entrevistas" ancho="max-w-2xl">
      <div className="space-y-3 text-[15px] leading-relaxed text-zinc-400">
        {conectada
          ? <p>Inicia sesión con tu cuenta de terapeuta para ver las entrevistas de tus consultantes.</p>
          : (
            <>
              <p>Aquí verás a tus consultantes cuando creen su cuenta, firmen el consentimiento informado y llenen su entrevista inicial desde su celular.</p>
              <p>Para eso, conecta tu base de datos de Supabase. Los pasos están en <code className="text-zinc-200">GUIA-INSTALACION.md</code>.</p>
            </>
          )}
        <a href="#consultante" className="inline-block text-emerald-300 hover:underline">Ver cómo lo ve tu consultante →</a>
      </div>
    </Pantalla>
  );
}

function ListaEntrevistas({ portal }) {
  const { navegar } = useRuta();
  const lista = portal.datos?.lista || [];
  return (
    <Pantalla grande titulo="Entrevistas"
      subtitulo={`${lista.length} ${lista.length === 1 ? 'consultante' : 'consultantes'} · ${lista.filter((x) => x.entrevista?.completada).length} enviadas`}
      acciones={(
        <>
          <button type="button" onClick={portal.cargar} disabled={portal.cargando} className={btnSec}><RefreshCw size={15} className={portal.cargando ? 'animate-spin' : ''} /> Actualizar</button>
          <button type="button" onClick={() => navegar(['entrevistas', 'invitar'])} className={btnPri}><UserPlus size={16} /> Invitar</button>
        </>
      )}>
      <div className="max-w-3xl space-y-4">
        {portal.error && <p className="text-[13.5px] text-rose-300">{portal.error}</p>}
        <Seccion>
          <div className="divide-y divide-line">
            {lista.length === 0 && <Vacio>{portal.cargando ? 'Cargando…' : 'Todavía nadie se ha registrado.'}</Vacio>}
            {lista.map((x) => {
              const [texto, punto] = estadoDe(x);
              return (
                <FilaEnlace key={x.id} onClick={() => navegar(['entrevistas', x.id])}
                  derecha={<span className="hidden xs:block text-[12.5px] text-zinc-500 tabular">{fecha(x.entrevista?.actualizada || x.creado)}</span>}>
                  <span className="flex flex-wrap items-baseline gap-x-2.5">
                    <span style={vt(`e-${x.id}`)} className="text-[15px] font-medium text-ink">{x.alias}</span>
                    <span className="text-[12.5px] text-zinc-500">@{x.usuario}</span>
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[12.5px]">
                    <span className="flex items-center gap-1.5 text-zinc-400"><span className={`w-1.5 h-1.5 rounded-full ${punto}`} />{texto}</span>
                    {!x.consentimiento && <span className="text-amber-300">sin consentimiento</span>}
                    {x.riesgo && <span className="flex items-center gap-1 text-rose-300"><AlertTriangle size={13} /> revisar seguridad</span>}
                  </span>
                </FilaEnlace>
              );
            })}
          </div>
        </Seccion>
      </div>
    </Pantalla>
  );
}

function EntrevistaDetalle({ portal, id, patients, onCambio, onAbrirAsistente }) {
  const { navegar } = useRuta();
  const x = portal.datos?.lista.find((c) => c.id === id);
  const vinculado = patients.find((p) => p.portalId === id);
  if (!x) {
    return <Pantalla atras={['entrevistas']} etiquetaAtras="Entrevistas" titulo={portal.cargando ? 'Cargando…' : 'No encontrada'}>{!portal.cargando && <Vacio>Esta persona ya no aparece.</Vacio>}</Pantalla>;
  }
  const r = x.entrevista?.respuestas || {};
  const [texto, punto] = estadoDe(x);
  return (
    <Pantalla atras={['entrevistas']} etiquetaAtras="Entrevistas" titulo={x.alias} tituloVT={`e-${x.id}`}
      subtitulo={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>@{x.usuario}</span><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${punto}`} />{texto}</span></span>}
      acciones={(
        <>
          <button type="button" onClick={() => onAbrirAsistente(x)} className={btnSec}><Sparkles size={15} /> Asistente</button>
          {vinculado
            ? <button type="button" onClick={() => navegar(['consultantes', vinculado.id, 'ficha'])} className={btnSec}><FolderOpen size={15} /> Expediente</button>
            : <button type="button" onClick={() => { const nuevo = crearExpediente(x); onCambio?.(); navegar(['consultantes', nuevo.id, 'ficha']); }} className={btnPri}><FolderPlus size={15} /> Crear expediente</button>}
        </>
      )}
      ancho="max-w-3xl">
      <div className="space-y-6">
        {x.riesgo && (
          <p className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[14px] text-rose-100">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" /> Indicó pensamientos de hacerse daño o de no querer vivir. Revisa su respuesta y valora el riesgo cuanto antes.
          </p>
        )}
        <Seccion titulo="Consentimiento informado" accion={x.consentimiento && <button type="button" onClick={() => navegar(['entrevistas', x.id, 'constancia'])} className="h-9 px-3 rounded-xl text-[13px] text-zinc-300 bg-raised inline-flex items-center gap-1.5"><FileSignature size={14} /> Constancia</button>}>
          <p className="p-4 text-[14.5px] text-zinc-300">
            {x.consentimiento
              ? <>{x.consentimiento.metodo === 'audio' ? 'Confirmado con su voz' : 'Firmado'} por <span className="text-ink">{x.consentimiento.nombre_firma}</span> el {fecha(x.consentimiento.aceptado_en)} · versión {x.consentimiento.version}.</>
              : 'Todavía no lo firma.'}
          </p>
          {x.consentimiento?.metodo === 'audio' && <div className="px-4 pb-4"><AudioConsentimiento consentimiento={x.consentimiento} /></div>}
        </Seccion>
        {contestadas(r) === 0 && <Vacio>Todavía no responde ninguna pregunta.</Vacio>}
        {SECCIONES_ENTREVISTA.map((s) => {
          const respondidas = s.preguntas.filter((p) => String(r[p.id] ?? '').trim());
          if (!respondidas.length) return null;
          return (
            <Seccion key={s.id} titulo={s.titulo}>
              <dl className="divide-y divide-line">
                {respondidas.map((p) => (
                  <div key={p.id} className="px-4 py-3.5">
                    <dt className="text-[12.5px] text-zinc-500">{p.titulo}</dt>
                    <dd className={`text-[15px] leading-relaxed whitespace-pre-wrap mt-0.5 ${p.riesgo && r[p.id] !== 'No' ? 'text-rose-300' : 'text-ink'}`}>{p.tipo === 'escala' ? `${r[p.id]} de 10` : r[p.id]}</dd>
                  </div>
                ))}
              </dl>
            </Seccion>
          );
        })}
      </div>
    </Pantalla>
  );
}

/** Crea un expediente con lo que la persona contestó en su entrevista (y lo deja vinculado). */
function crearExpediente(x) {
  const r = x.entrevista?.respuestas || {};
  const linea = (k, v) => (String(v ?? '').trim() ? `${k}: ${v}` : null);
  return addPatient({
    nombre: x.alias,
    edad: /^\d+$/.test(String(r.edad || '').trim()) ? Number(r.edad) : '',
    ocupacion: r.ocupacion || '',
    motivoConsulta: [r.motivo, linea('Desde', r.desde_cuando), linea('Malestar actual (0 a 10)', r.intensidad), linea('Lo que espera de la terapia', r.expectativas)].filter(Boolean).join('\n'),
    antecedentes: [
      linea('Salud física', r.salud_fisica), linea('Medicamentos', r.medicamentos), linea('Consumo', r.consumo),
      linea('Tratamientos previos', r.tratamientos_previos), linea('Diagnósticos previos', r.diagnosticos),
      linea('Salud mental en la familia', r.salud_mental_familia), linea('Seguridad', r.riesgo && r.riesgo !== 'No' ? `${r.riesgo}. ${r.riesgo_detalle || ''}` : null),
    ].filter(Boolean).join('\n'),
    diagnostico: '',
    estado: 'Activo',
    portalId: x.id,
  });
}

function Constancia({ portal, id }) {
  const x = portal.datos?.lista.find((c) => c.id === id);
  if (!x?.consentimiento) {
    return <Pantalla atras={['entrevistas', id]} etiquetaAtras="Entrevista" titulo="Constancia"><Vacio>{portal.cargando ? 'Cargando…' : 'Todavía no firma el consentimiento.'}</Vacio></Pantalla>;
  }
  return (
    <Pantalla atras={['entrevistas', id]} etiquetaAtras={x.alias} titulo="Constancia de consentimiento" ancho="max-w-3xl">
      <div className="space-y-5">
        <ConstanciaConsentimiento alias={x.alias} consentimiento={x.consentimiento} />
        <BotonImprimir />
      </div>
    </Pantalla>
  );
}

function Invitar() {
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}${window.location.pathname}#consultante`;
  const mensaje = `Para tu entrevista inicial entra aquí: ${link}\nElige "Consultante" y crea tu cuenta.`;
  const copiar = () => navigator.clipboard?.writeText(mensaje)
    .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); }).catch(() => {});

  return (
    <Pantalla atras={['entrevistas']} etiquetaAtras="Entrevistas" titulo="Invitar" subtitulo="Mándale este link: crea su cuenta, firma el consentimiento y llena su entrevista desde su celular." ancho="max-w-2xl">
      <Seccion titulo="Mensaje para enviar">
        <div className="p-5 space-y-4">
          <p className="text-[14.5px] leading-relaxed text-zinc-300 break-all">Para tu entrevista inicial entra aquí: <span className="text-ink select-all">{link}</span><br />Elige "Consultante" y crea tu cuenta.</p>
          <button type="button" onClick={copiar} className={btnPri}>{copiado ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar mensaje</>}</button>
        </div>
      </Seccion>
    </Pantalla>
  );
}
