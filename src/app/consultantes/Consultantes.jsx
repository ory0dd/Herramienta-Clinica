import React, { useState } from 'react';
import { Plus, Search, Pencil, Sparkles, Activity, NotebookPen, FileText, Link2, Mic } from 'lucide-react';
import { transcribirAudio } from '../../utils/ia';
import {
  getPatients, addPatient, updatePatient, deletePatient, getPatientNotes, savePatientNote, getPatientTestResults,
  getPatientInformes, savePatientInforme, deletePatientInforme, getPerfil,
} from '../../utils/storage';
import { TIPOS_INFORME, tipoInforme } from '../../data/informes';
import { Documento, BotonImprimir } from '../Documento';
import { useRuta, vt } from '../rutas';
import { Pantalla, Subtabs, Seccion, FilaEnlace, Vacio, Campo, Confirmar, inp, area, btnPri, btnSec, btnTxt } from '../ui';

const ESTADOS = { Activo: 'bg-emerald-400', Pausa: 'bg-amber-400', Alta: 'bg-zinc-500' };
const fecha = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Consultantes: lista → detalle (Ficha, Notas, Pruebas) → editar / nueva nota.
 * `onCambio` avisa a la app para que los demás apartados vean los cambios.
 */
export default function Consultantes({ id, sub, extra, extra2, onCambio, onAbrirAsistente, onAplicarPrueba }) {
  const [version, setVersion] = useState(0); // fuerza volver a leer del almacenamiento tras un cambio
  const cambio = () => { setVersion((v) => v + 1); onCambio?.(); };
  const pacientes = getPatients();
  void version;

  if (id === 'nuevo') return <ConsultanteForm onGuardado={cambio} />;
  const p = id ? pacientes.find((x) => x.id === id) : null;
  if (id && !p) return <Pantalla atras={['consultantes']} etiquetaAtras="Consultantes" titulo="No encontrado"><Vacio>Este expediente ya no existe.</Vacio></Pantalla>;
  if (p && sub === 'editar') return <ConsultanteForm p={p} onGuardado={cambio} />;
  if (p && sub === 'notas' && extra === 'nueva') return <NotaForm p={p} onGuardado={cambio} />;
  if (p && sub === 'informes' && extra === 'nuevo') return <InformeForm p={p} onGuardado={cambio} />;
  if (p && sub === 'informes' && extra && extra2 === 'editar') return <InformeForm p={p} informeId={extra} onGuardado={cambio} />;
  if (p && sub === 'informes' && extra) return <InformeVer p={p} informeId={extra} onGuardado={cambio} />;
  if (p) return <ConsultanteDetalle p={p} sub={sub || 'ficha'} onAbrirAsistente={onAbrirAsistente} onAplicarPrueba={onAplicarPrueba} />;
  return <ConsultantesLista pacientes={pacientes} />;
}

function ConsultantesLista({ pacientes }) {
  const { navegar } = useRuta();
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('Activo');
  const q = buscar.trim().toLowerCase();
  const lista = pacientes
    .filter((p) => filtro === 'todos' || p.estado === filtro)
    .filter((p) => !q || `${p.nombre} ${p.codigo} ${p.motivoConsulta}`.toLowerCase().includes(q));
  const cuenta = (e) => pacientes.filter((p) => p.estado === e).length;

  return (
    <Pantalla grande titulo="Consultantes" subtitulo={`${pacientes.length} ${pacientes.length === 1 ? 'expediente' : 'expedientes'}`}
      acciones={<button type="button" onClick={() => navegar(['consultantes', 'nuevo'])} className={btnPri}><Plus size={16} strokeWidth={2.5} /> Nuevo</button>}>
      <div className="space-y-4 max-w-3xl">
        <label className="relative block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre, código o motivo" aria-label="Buscar consultante" className={`${inp} pl-10`} />
        </label>
        <Subtabs items={[
          { id: 'Activo', label: 'Activos', cuenta: cuenta('Activo') },
          { id: 'Pausa', label: 'En pausa', cuenta: cuenta('Pausa') },
          { id: 'Alta', label: 'De alta', cuenta: cuenta('Alta') },
          { id: 'todos', label: 'Todos' },
        ]} activo={filtro} onCambio={setFiltro} />
        <Seccion>
          <div className="divide-y divide-line">
            {lista.length === 0 && <Vacio>{q ? 'Nadie coincide con la búsqueda.' : 'No hay expedientes aquí.'}</Vacio>}
            {lista.map((p) => (
              <FilaEnlace key={p.id} onClick={() => navegar(['consultantes', p.id, 'ficha'])}
                derecha={<span className="hidden xs:flex items-center gap-1.5 text-[12.5px] text-zinc-500"><span className={`w-1.5 h-1.5 rounded-full ${ESTADOS[p.estado] || 'bg-zinc-500'}`} />{p.estado}</span>}>
                <span className="flex items-baseline gap-2.5">
                  <span className="text-[12.5px] text-zinc-500 tabular">{p.codigo}</span>
                  <span style={vt(`c-${p.id}`)} className="text-[15px] font-medium text-ink truncate">{p.nombre}</span>
                </span>
                {p.motivoConsulta && <span className="block text-[13px] text-zinc-500 truncate mt-0.5">{p.motivoConsulta}</span>}
              </FilaEnlace>
            ))}
          </div>
        </Seccion>
      </div>
    </Pantalla>
  );
}

function ConsultanteDetalle({ p, sub, onAbrirAsistente, onAplicarPrueba }) {
  const { navegar } = useRuta();
  const notas = getPatientNotes(p.id);
  const pruebas = getPatientTestResults(p.id);
  const informes = getPatientInformes(p.id);
  const tab = ['ficha', 'notas', 'pruebas', 'informes'].includes(sub) ? sub : 'ficha';

  return (
    <Pantalla atras={['consultantes']} etiquetaAtras="Consultantes" titulo={p.nombre} tituloVT={`c-${p.id}`}
      subtitulo={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="tabular">{p.codigo}</span><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${ESTADOS[p.estado] || 'bg-zinc-500'}`} />{p.estado}</span>{p.edad && <span>{p.edad} años</span>}</span>}
      acciones={(
        <>
          <button type="button" onClick={() => onAbrirAsistente(p)} className={btnSec}><Sparkles size={15} /> Asistente</button>
          <button type="button" onClick={() => navegar(['consultantes', p.id, 'editar'])} className={btnSec}><Pencil size={15} /> Editar</button>
        </>
      )}
      ancho="max-w-3xl">
      <Subtabs items={[
        { id: 'ficha', label: 'Ficha' },
        { id: 'notas', label: 'Notas', cuenta: notas.length },
        { id: 'pruebas', label: 'Pruebas', cuenta: pruebas.length },
        { id: 'informes', label: 'Informes', cuenta: informes.length },
      ]} activo={tab} onCambio={(t) => navegar(['consultantes', p.id, t], { reemplazar: true })} />

      {tab === 'ficha' && (
        <div className="space-y-6">
          {p.portalId && (
            <button type="button" onClick={() => navegar(['entrevistas', p.portalId])} className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 flex items-center gap-3 text-left text-[14px] text-zinc-300 hover:bg-white/[0.025]">
              <Link2 size={16} className="text-emerald-300 shrink-0" /> Vinculado a su entrevista en línea · ver respuestas y consentimiento
            </button>
          )}
          {[['Motivo de consulta', p.motivoConsulta], ['Antecedentes', p.antecedentes], ['Diagnóstico o hipótesis', p.diagnostico]].map(([t, v]) => (
            <Seccion key={t} titulo={t}><p className="p-4 text-[15px] leading-relaxed text-zinc-200 whitespace-pre-wrap">{v || <span className="text-zinc-500">Sin registrar.</span>}</p></Seccion>
          ))}
          <Seccion titulo="Datos">
            <dl className="divide-y divide-line text-[14px]">
              {[['Género', p.genero], ['Ocupación', p.ocupacion], ['Frecuencia', p.frecuencia], ['Ingreso', p.fechaIngreso], ['Honorarios', p.honorarios ? `${p.honorarios} pesos por sesión` : null], ['Teléfono', p.telefono], ['Contacto de emergencia', p.contactoEmergencia]].map(([k, v]) => (
                <div key={k} className="px-4 py-3 flex justify-between gap-4"><dt className="text-zinc-500">{k}</dt><dd className="text-zinc-200 text-right">{v || '—'}</dd></div>
              ))}
            </dl>
          </Seccion>
        </div>
      )}

      {tab === 'notas' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navegar(['consultantes', p.id, 'notas', 'nueva'])} className={btnPri}><NotebookPen size={16} /> Nueva nota</button>
            <button type="button" onClick={() => onAbrirAsistente(p)} className={btnSec}><Sparkles size={15} /> Redactar con el asistente</button>
          </div>
          {notas.length === 0 && <Vacio>Aún no hay notas.</Vacio>}
          {notas.map((n) => (
            <Seccion key={n.id} titulo={n.tipo || 'Nota'} nota={fecha(n.fecha)}>
              <p className="p-4 text-[14.5px] leading-relaxed text-zinc-200 whitespace-pre-wrap">{n.contenido}</p>
            </Seccion>
          ))}
        </div>
      )}

      {tab === 'pruebas' && (
        <div className="space-y-4">
          <button type="button" onClick={() => onAplicarPrueba(p)} className={btnPri}><Activity size={16} /> Aplicar una prueba</button>
          <Seccion>
            <ul className="divide-y divide-line">
              {pruebas.length === 0 && <Vacio>Aún no hay pruebas aplicadas.</Vacio>}
              {pruebas.map((t) => (
                <li key={t.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium text-ink">{t.nombreTest}</span>
                    <span className="text-[12.5px] text-zinc-500 tabular">{fecha(t.fecha)}</span>
                  </div>
                  <p className="text-[14px] text-zinc-300 mt-1 tabular">{t.score}{t.maximo ? ` de ${t.maximo}` : ''} puntos · {t.severidad}</p>
                  {t.interpretacion && <p className="text-[13.5px] text-zinc-500 mt-1 leading-relaxed">{t.interpretacion}</p>}
                </li>
              ))}
            </ul>
          </Seccion>
        </div>
      )}

      {tab === 'informes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navegar(['consultantes', p.id, 'informes', 'nuevo'])} className={btnPri}><FileText size={16} /> Nuevo informe</button>
            <button type="button" onClick={() => onAbrirAsistente(p)} className={btnSec}><Sparkles size={15} /> Redactar con el asistente</button>
          </div>
          <Seccion>
            <div className="divide-y divide-line">
              {informes.length === 0 && <Vacio>Aún no hay informes. Crea uno desde una estructura base.</Vacio>}
              {informes.map((inf) => (
                <FilaEnlace key={inf.id} onClick={() => navegar(['consultantes', p.id, 'informes', inf.id])}
                  derecha={<span className="text-[12.5px] text-zinc-500 tabular">{fecha(inf.fecha)}</span>}>
                  <span style={vt(`i-${inf.id}`)} className="block text-[15px] font-medium text-ink w-fit">{inf.titulo}</span>
                  <span className="block text-[13px] text-zinc-500">{tipoInforme(inf.tipo).nombre}</span>
                </FilaEnlace>
              ))}
            </div>
          </Seccion>
        </div>
      )}
    </Pantalla>
  );
}

const TIPOS_NOTA = ['Nota de evolución', 'Nota SOAP', 'Nota breve', 'Entrevista', 'Cierre'];

function NotaForm({ p, onGuardado }) {
  const { atras } = useRuta();
  const [tipo, setTipo] = useState(TIPOS_NOTA[0]);
  const [contenido, setContenido] = useState('');
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [error, setError] = useState('');
  const subirAudio = async (archivo) => {
    if (!archivo) return;
    setError('');
    setTranscribiendo(true);
    try {
      const texto = await transcribirAudio(archivo);
      setContenido((c) => (c.trim() ? `${c.trim()}\n\n${texto}` : texto));
    } catch (e) {
      setError(e.message);
    } finally {
      setTranscribiendo(false);
    }
  };
  const guardar = (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    savePatientNote(p.id, { tipo, contenido: contenido.trim() });
    onGuardado();
    atras(['consultantes', p.id, 'notas']);
  };
  return (
    <Pantalla atras={['consultantes', p.id, 'notas']} etiquetaAtras={p.nombre} titulo="Nueva nota" ancho="max-w-2xl">
      <form onSubmit={guardar} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TIPOS_NOTA.map((t) => (
            <button key={t} type="button" onClick={() => setTipo(t)}
              className={`h-9 px-3.5 rounded-xl text-[13.5px] transition-colors ${tipo === t ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/50' : 'bg-raised text-zinc-400'}`}>{t}</button>
          ))}
        </div>
        <textarea autoFocus rows={12} value={contenido} onChange={(e) => setContenido(e.target.value)} placeholder="Escribe la nota o transcribe el audio de la sesión…" aria-label="Contenido de la nota" className={area} />
        <label className={`${btnSec} cursor-pointer w-fit`}>
          <Mic size={16} /> {transcribiendo ? 'Transcribiendo…' : 'Transcribir audio'}
          <input type="file" accept="audio/*" className="sr-only" disabled={transcribiendo} onChange={(e) => { subirAudio(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {error && <p className="text-[13.5px] text-rose-300">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={!contenido.trim()} className={btnPri}>Guardar nota</button>
          <button type="button" onClick={() => atras()} className={btnTxt}>Cancelar</button>
        </div>
      </form>
    </Pantalla>
  );
}

const VACIO = {
  nombre: '', edad: '', genero: 'Femenino', ocupacion: '', telefono: '', contactoEmergencia: '',
  motivoConsulta: '', antecedentes: '', diagnostico: '', estado: 'Activo', frecuencia: 'Semanal', honorarios: '',
};

function ConsultanteForm({ p, onGuardado }) {
  const { navegar, atras } = useRuta();
  const [f, setF] = useState(() => (p ? { ...VACIO, ...p } : VACIO));
  const [borrando, setBorrando] = useState(false);
  const campo = (k) => ({ value: f[k] ?? '', onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const listo = f.nombre.trim().length > 1;

  const guardar = (e) => {
    e.preventDefault();
    if (!listo) return;
    const datos = { ...f, nombre: f.nombre.trim(), edad: f.edad ? Number(f.edad) : '', honorarios: f.honorarios ? Number(f.honorarios) : '' };
    if (p) { updatePatient(p.id, datos); onGuardado(); atras(['consultantes', p.id, 'ficha']); return; }
    const nuevo = addPatient(datos);
    onGuardado();
    navegar(['consultantes', nuevo.id, 'ficha'], { reemplazar: true });
  };

  return (
    <Pantalla atras={p ? ['consultantes', p.id, 'ficha'] : ['consultantes']} etiquetaAtras={p ? p.nombre : 'Consultantes'}
      titulo={p ? 'Editar expediente' : 'Nuevo consultante'} subtitulo={p ? p.codigo : 'El código (C-01, C-02…) se asigna solo.'} ancho="max-w-2xl">
      <form onSubmit={guardar} className="space-y-8">
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <legend className="text-[12px] uppercase tracking-[0.09em] text-zinc-500 mb-3">Datos generales</legend>
          <Campo etiqueta="Nombre o alias" className="sm:col-span-2" ayuda="Si el expediente se comparte con el asistente, el nombre se reemplaza por el código."><input {...campo('nombre')} className={inp} /></Campo>
          <Campo etiqueta="Edad"><input {...campo('edad')} inputMode="numeric" className={inp} /></Campo>
          <Campo etiqueta="Género">
            <select {...campo('genero')} className={inp}>{['Femenino', 'Masculino', 'No binario', 'Otro'].map((g) => <option key={g}>{g}</option>)}</select>
          </Campo>
          <Campo etiqueta="Ocupación" className="sm:col-span-2"><input {...campo('ocupacion')} className={inp} /></Campo>
          <Campo etiqueta="Teléfono"><input {...campo('telefono')} inputMode="tel" className={inp} /></Campo>
          <Campo etiqueta="Contacto de emergencia"><input {...campo('contactoEmergencia')} className={inp} /></Campo>
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="text-[12px] uppercase tracking-[0.09em] text-zinc-500 mb-3">Clínico</legend>
          <Campo etiqueta="Motivo de consulta"><textarea rows={3} {...campo('motivoConsulta')} className={area} /></Campo>
          <Campo etiqueta="Antecedentes"><textarea rows={3} {...campo('antecedentes')} className={area} /></Campo>
          <Campo etiqueta="Diagnóstico o hipótesis"><input {...campo('diagnostico')} className={inp} /></Campo>
        </fieldset>
        <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <legend className="text-[12px] uppercase tracking-[0.09em] text-zinc-500 mb-3">Proceso</legend>
          <Campo etiqueta="Estado"><select {...campo('estado')} className={inp}><option>Activo</option><option>Pausa</option><option>Alta</option></select></Campo>
          <Campo etiqueta="Frecuencia"><select {...campo('frecuencia')} className={inp}><option>Semanal</option><option>Quincenal</option><option>Mensual</option></select></Campo>
          <Campo etiqueta="Honorarios (pesos)"><input {...campo('honorarios')} inputMode="numeric" className={inp} /></Campo>
        </fieldset>
        <div className="flex gap-2">
          <button type="submit" disabled={!listo} className={btnPri}>{p ? 'Guardar cambios' : 'Crear expediente'}</button>
          <button type="button" onClick={() => atras()} className={btnTxt}>Cancelar</button>
        </div>
        {p && (borrando ? (
          <Confirmar pregunta={`¿Borrar el expediente de ${p.nombre}? Se pierden su ficha, notas y pruebas en este dispositivo.`} siTexto="Sí, borrar"
            onSi={() => { deletePatient(p.id); onGuardado(); navegar(['consultantes'], { reemplazar: true }); }} onNo={() => setBorrando(false)} />
        ) : (
          <button type="button" onClick={() => setBorrando(true)} className="text-[13.5px] text-rose-300/80 hover:text-rose-300">Borrar expediente</button>
        ))}
      </form>
    </Pantalla>
  );
}

// ---------- Informes ----------

// Las líneas cortas sin puntuación final se muestran como subtítulos del informe
const esSubtitulo = (l) => l.trim() && l.length < 60 && !/[.:,;)]$/.test(l.trim()) && !l.trim().startsWith('-');

function InformeVer({ p, informeId, onGuardado }) {
  const { navegar } = useRuta();
  const [borrando, setBorrando] = useState(false);
  const inf = getPatientInformes(p.id).find((i) => i.id === informeId);
  const t = getPerfil();
  if (!inf) return <Pantalla atras={['consultantes', p.id, 'informes']} etiquetaAtras={p.nombre} titulo="No encontrado"><Vacio>Este informe ya no existe.</Vacio></Pantalla>;
  return (
    <Pantalla atras={['consultantes', p.id, 'informes']} etiquetaAtras={p.nombre} titulo={inf.titulo} tituloVT={`i-${inf.id}`} subtitulo={inf.titulo === tipoInforme(inf.tipo).nombre ? null : tipoInforme(inf.tipo).nombre}
      acciones={<button type="button" onClick={() => navegar(['consultantes', p.id, 'informes', inf.id, 'editar'])} className={btnSec}><Pencil size={15} /> Editar</button>}
      ancho="max-w-3xl">
      <div className="space-y-5">
        <Documento
          titulo={inf.titulo}
          datos={[['Consultante', p.nombre], ['Código', p.codigo], ['Fecha', fecha(inf.fecha)], ['Elaboró', t.nombre || null]]}
          pie={t.nombre ? `${t.nombre}${t.cedula ? ` · Cédula profesional ${t.cedula}` : ''}` : null}
        >
          {inf.contenido.split('\n').map((l, i) => (esSubtitulo(l)
            ? <h3 key={i} className="font-semibold pt-2">{l}</h3>
            : l.trim() ? <p key={i} className="whitespace-pre-wrap">{l}</p> : null))}
        </Documento>
        <div className="flex flex-wrap gap-2">
          <BotonImprimir />
          {!borrando && <button type="button" onClick={() => setBorrando(true)} className={btnTxt}>Borrar informe</button>}
        </div>
        {borrando && (
          <Confirmar pregunta={`¿Borrar “${inf.titulo}”?`} siTexto="Sí, borrar" onNo={() => setBorrando(false)}
            onSi={() => { deletePatientInforme(p.id, inf.id); onGuardado(); navegar(['consultantes', p.id, 'informes'], { reemplazar: true }); }} />
        )}
      </div>
    </Pantalla>
  );
}

function InformeForm({ p, informeId, onGuardado }) {
  const { navegar, atras } = useRuta();
  const existente = informeId ? getPatientInformes(p.id).find((i) => i.id === informeId) : null;
  const borrador = (tipo) => tipoInforme(tipo).plantilla(p, { pruebas: getPatientTestResults(p.id) });
  const [f, setF] = useState(() => existente || { tipo: TIPOS_INFORME[0].id, titulo: TIPOS_INFORME[0].nombre, contenido: borrador(TIPOS_INFORME[0].id) });
  const [tocado, setTocado] = useState(!!existente);

  const elegirTipo = (tipo) => {
    // Si todavía no se escribió nada, cambia también el título y la estructura base
    setF(tocado ? { ...f, tipo } : { tipo, titulo: tipoInforme(tipo).nombre, contenido: borrador(tipo) });
  };
  const guardar = (e) => {
    e.preventDefault();
    if (!f.titulo.trim() || !f.contenido.trim()) return;
    const g = savePatientInforme(p.id, { ...f, titulo: f.titulo.trim() });
    onGuardado();
    if (existente) atras(['consultantes', p.id, 'informes', g.id]);
    else navegar(['consultantes', p.id, 'informes', g.id], { reemplazar: true });
  };

  return (
    <Pantalla atras={existente ? ['consultantes', p.id, 'informes', existente.id] : ['consultantes', p.id, 'informes']} etiquetaAtras={existente ? existente.titulo : p.nombre}
      titulo={existente ? 'Editar informe' : 'Nuevo informe'} subtitulo={`${p.codigo} · ${p.nombre}`} ancho="max-w-3xl">
      <form onSubmit={guardar} className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {TIPOS_INFORME.map((tp) => (
            <button key={tp.id} type="button" onClick={() => elegirTipo(tp.id)}
              className={`h-9 px-3.5 rounded-xl text-[13.5px] transition-colors ${f.tipo === tp.id ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/50' : 'bg-raised text-zinc-400'}`}>{tp.nombre}</button>
          ))}
        </div>
        <Campo etiqueta="Título"><input value={f.titulo} onChange={(e) => { setF({ ...f, titulo: e.target.value }); setTocado(true); }} className={inp} /></Campo>
        <Campo etiqueta="Contenido" ayuda="Las líneas cortas sin punto final se muestran como subtítulos del informe.">
          <textarea rows={18} value={f.contenido} onChange={(e) => { setF({ ...f, contenido: e.target.value }); setTocado(true); }} className={`${area} font-sans`} />
        </Campo>
        <div className="flex gap-2">
          <button type="submit" disabled={!f.titulo.trim() || !f.contenido.trim()} className={btnPri}>Guardar informe</button>
          <button type="button" onClick={() => atras()} className={btnTxt}>Cancelar</button>
        </div>
      </form>
    </Pantalla>
  );
}
