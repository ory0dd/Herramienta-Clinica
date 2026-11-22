import React, { useState } from 'react';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { CLINICAL_TESTS } from '../../data/clinicalTestsBank';
import { savePatientTestResult } from '../../utils/storage';
import { useRuta, vt, animar } from '../rutas';
import { Pantalla, Seccion, FilaEnlace, Vacio, Campo, inp, btnPri, btnSec, btnTxt } from '../ui';

const PRUEBAS = Object.values(CLINICAL_TESTS);
const ESCALA_BASE = [
  { value: 0, label: 'En absoluto' }, { value: 1, label: 'Levemente' }, { value: 2, label: 'Moderadamente' }, { value: 3, label: 'Severamente' },
];
const sinNumero = (t) => String(t || '').replace(/\s*\(\d+\)\s*$/, '');

/** Pruebas: lista → presentación → aplicación pregunta por pregunta → resultado. */
export default function Pruebas({ testId, patients, pacienteInicial }) {
  if (testId) {
    const test = CLINICAL_TESTS[testId];
    if (!test) return <Pantalla atras={['pruebas']} etiquetaAtras="Pruebas" titulo="No encontrada"><Vacio>Esa prueba no existe.</Vacio></Pantalla>;
    return <AplicarPrueba test={test} patients={patients} pacienteInicial={pacienteInicial} />;
  }
  return <ListaPruebas />;
}

function ListaPruebas() {
  const { navegar } = useRuta();
  const grupos = {};
  PRUEBAS.forEach((t) => { (grupos[t.poblacion || 'General'] ||= []).push(t); });
  return (
    <Pantalla grande titulo="Pruebas" subtitulo={`${PRUEBAS.length} instrumentos con calificación automática`}>
      <div className="space-y-6 max-w-3xl">
        {Object.entries(grupos).map(([poblacion, lista]) => (
          <Seccion key={poblacion} titulo={poblacion}>
            <div className="divide-y divide-line">
              {lista.map((t) => (
                <FilaEnlace key={t.id} onClick={() => navegar(['pruebas', t.id])}
                  derecha={<span className="hidden xs:block text-[12.5px] text-zinc-500 tabular">{t.items?.length} reactivos</span>}>
                  <span style={vt(`t-${t.id}`)} className="block text-[15px] font-medium text-ink w-fit">{t.siglas || t.id.toUpperCase()}</span>
                  <span className="block text-[13px] text-zinc-500 truncate">{t.nombre}</span>
                </FilaEnlace>
              ))}
            </div>
          </Seccion>
        ))}
      </div>
    </Pantalla>
  );
}

function AplicarPrueba({ test, patients, pacienteInicial }) {
  const { navegar } = useRuta();
  const [paso, setPaso] = useState('intro'); // intro | aplicando | resultado
  const [paciente, setPaciente] = useState(pacienteInicial?.id || patients[0]?.id || '');
  const [informante, setInformante] = useState(test.informantesDisponibles?.[0]?.id || null);
  const [respuestas, setRespuestas] = useState({});
  const [i, setI] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const items = test.items || [];
  const item = items[i];
  const escala = item?.escala || test.escala || ESCALA_BASE;
  const p = patients.find((x) => x.id === paciente);

  const resultado = paso === 'resultado' ? test.calcularResultado?.(respuestas, informante || undefined) : null;

  const responder = (valor) => {
    const nuevas = { ...respuestas, [item.id]: valor };
    animar(() => {
      setRespuestas(nuevas);
      if (i < items.length - 1) setI(i + 1); else setPaso('resultado');
    }, 'adelante');
  };
  const anterior = () => animar(() => setI(Math.max(0, i - 1)), 'atras');

  const guardar = () => {
    if (!p || !resultado) return;
    savePatientTestResult(p.id, {
      testId: test.id, nombreTest: test.nombre, score: resultado.totalScore, maximo: resultado.maxScore,
      severidad: resultado.nivel, interpretacion: resultado.interpretacion, totalReactivos: items.length,
    });
    setGuardado(true);
  };

  if (paso === 'intro') {
    return (
      <Pantalla atras={['pruebas']} etiquetaAtras="Pruebas" titulo={test.siglas || test.nombre} tituloVT={`t-${test.id}`} subtitulo={test.nombre} ancho="max-w-2xl">
        <div className="space-y-6">
          <p className="text-[15px] leading-relaxed text-zinc-300">{test.descripcion}</p>
          <dl className="grid grid-cols-2 gap-2 text-[13.5px]">
            {[['Reactivos', items.length], ['Duración', test.duracionAprox], ['Población', test.poblacion], ['Periodo', test.marcoTemporal]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface border border-line px-4 py-3"><dt className="text-zinc-500 text-[12px]">{k}</dt><dd className="text-zinc-200 mt-0.5">{v}</dd></div>
            ))}
          </dl>
          {test.instrucciones && <Seccion titulo="Instrucciones"><p className="p-4 text-[14.5px] leading-relaxed text-zinc-300">{test.instrucciones}</p></Seccion>}
          <Campo etiqueta="Consultante">
            <select value={paciente} onChange={(e) => setPaciente(e.target.value)} className={inp}>
              {patients.length === 0 && <option value="">Primero crea un expediente</option>}
              {patients.map((x) => <option key={x.id} value={x.id}>{x.codigo} · {x.nombre}</option>)}
            </select>
          </Campo>
          {test.informantesDisponibles && (
            <Campo etiqueta="Quién responde">
              <select value={informante} onChange={(e) => setInformante(e.target.value)} className={inp}>
                {test.informantesDisponibles.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </Campo>
          )}
          <button type="button" disabled={!paciente} onClick={() => animar(() => { setRespuestas({}); setI(0); setPaso('aplicando'); }, 'adelante', true)} className={btnPri}>Empezar</button>
        </div>
      </Pantalla>
    );
  }

  if (paso === 'aplicando') {
    return (
      <Pantalla titulo={test.siglas || test.nombre} tituloVT={`t-${test.id}`} subtitulo={p ? `${p.codigo} · ${p.nombre}` : null} ancho="max-w-2xl"
        acciones={<button type="button" onClick={() => animar(() => setPaso('intro'), 'atras', true)} className={btnTxt}>Salir</button>}>
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[12.5px] text-zinc-500 tabular"><span>Reactivo {i + 1} de {items.length}</span><span>{Math.round((i / items.length) * 100)}%</span></div>
          <div className="h-1 rounded-full bg-raised overflow-hidden"><div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${(i / items.length) * 100}%` }} /></div>
        </div>
        <div style={vt('paso')} className="space-y-6">
          <p className="text-[20px] xs:text-[22px] leading-snug text-ink">{item.text || item.texto}</p>
          <div className="grid gap-2">
            {escala.map((o) => (
              <button key={o.value} type="button" onClick={() => responder(o.value)}
                className={`min-h-12 px-4 py-3 rounded-2xl text-left text-[15px] transition-colors ${respuestas[item.id] === o.value ? 'bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-400/50' : 'bg-surface border border-line text-zinc-200 hover:border-zinc-500'}`}>
                {sinNumero(o.label)}{o.desc && <span className="block text-[12.5px] text-zinc-500 mt-0.5">{o.desc}</span>}
              </button>
            ))}
          </div>
        </div>
        {i > 0 && <button type="button" onClick={anterior} className={`${btnTxt} mt-6 -ml-3`}><ArrowLeft size={16} /> Anterior</button>}
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Resultado" subtitulo={`${test.siglas || test.nombre}${p ? ` · ${p.codigo}` : ''}`} ancho="max-w-2xl">
      <div style={vt('paso')} className="space-y-6">
        {resultado ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[64px] leading-none text-ink tabular">{resultado.totalScore}</span>
              {resultado.maxScore != null && <span className="text-[15px] text-zinc-500 tabular">de {resultado.maxScore}</span>}
            </div>
            <p className="text-[18px] font-medium text-ink">{resultado.nivel}</p>
            {resultado.interpretacion && <p className="text-[15px] leading-relaxed text-zinc-300">{resultado.interpretacion}</p>}
            {/riesgo|ideación|⚠️/i.test(resultado.interpretacion || '') && (
              <p className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[14px] text-rose-100">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" /> Revisa este resultado en sesión y valora el riesgo directamente con la persona.
              </p>
            )}
          </>
        ) : <Vacio>No se pudo calcular el resultado de esta prueba.</Vacio>}
        <div className="flex flex-wrap gap-2">
          {guardado ? (
            <button type="button" onClick={() => navegar(['consultantes', paciente, 'pruebas'])} className={btnPri}><Check size={16} /> Guardado · ver en el expediente</button>
          ) : (
            <button type="button" onClick={guardar} disabled={!resultado || !p} className={btnPri}>Guardar en el expediente</button>
          )}
          <button type="button" onClick={() => animar(() => { setPaso('intro'); setGuardado(false); }, 'atras', true)} className={btnSec}>Aplicar otra vez</button>
        </div>
      </div>
    </Pantalla>
  );
}
