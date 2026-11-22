/**
 * useCuaderno.js
 * Todo lo de un caso en un solo lugar: fuentes (expediente, entrevista, sesiones, documentos),
 * conversación y directrices. Se guarda por caso (navegador y, con sesión, Supabase).
 */
import { useEffect, useMemo, useState } from 'react';
import { getActiveTherapist, getPatientNotes, getPatientTestResults } from '../../utils/storage';
import { guardarLocal, hayNube } from '../../utils/nube';
import { preguntarIA, desidentificar } from '../../utils/ia';
import { cargarPortal, entrevistaComoTexto } from '../../utils/portal';
import { AJUSTES_INICIALES, armarSistema } from '../../data/asistente';

const clave = (nombre) => `oasis_clinico_${getActiveTherapist()?.id || 'anon'}_${nombre}`;
export const leer = (nombre, def) => { try { const r = localStorage.getItem(clave(nombre)); return r ? JSON.parse(r) : def; } catch (_) { return def; } };
export const escribir = (nombre, valor) => guardarLocal(clave(nombre), JSON.stringify(valor));
export const fechaCorta = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// Consultantes del portal, para no volver a pedirlos en cada pantalla
let portalCache = null;
export function usePortalLista(therapist) {
  const [lista, setLista] = useState(portalCache || []);
  useEffect(() => {
    if (!hayNube || !therapist?.nube) return;
    cargarPortal().then((r) => { portalCache = r.lista; setLista(r.lista); }).catch(() => {});
  }, [therapist?.nube]);
  return lista;
}

/** Ajustes del asistente (marco, formato, indicaciones…). Son de la terapeuta, no de un caso. */
export function useAjustesAsistente() {
  const [ajustes, setState] = useState(() => ({ ...AJUSTES_INICIALES, ...leer('asistente_ajustes', {}) }));
  const setAjustes = (a) => { setState(a); escribir('asistente_ajustes', a); };
  return [ajustes, setAjustes];
}

export function useCuaderno(caso, { patients = [], portal = [] } = {}) {
  const [ajustes, setAjustes] = useAjustesAsistente();
  const [docs, setDocsS] = useState(() => leer(`docs_${caso}`, []));
  const [sesiones, setSesionesS] = useState(() => leer(`sesiones_${caso}`, []));
  const [chat, setChatS] = useState(() => leer(`chat_${caso}`, []));
  const [elegidas, setElegidasS] = useState(() => leer(`fuentes_${caso}`, {}));

  useEffect(() => {
    setDocsS(leer(`docs_${caso}`, []));
    setSesionesS(leer(`sesiones_${caso}`, []));
    setChatS(leer(`chat_${caso}`, []));
    setElegidasS(leer(`fuentes_${caso}`, {}));
  }, [caso]);

  const persistir = (nombre, setter) => (v) => { setter(v); escribir(`${nombre}_${caso}`, v); };
  const setDocs = persistir('docs', setDocsS);
  const setSesiones = persistir('sesiones', setSesionesS);
  const setChat = persistir('chat', setChatS);
  const setElegidas = persistir('fuentes', setElegidasS);

  const paciente = caso?.startsWith('exp:') ? patients.find((p) => `exp:${p.id}` === caso) : null;
  const delPortal = caso?.startsWith('pt:') ? portal.find((x) => `pt:${x.id}` === caso) : null;
  const nombre = paciente ? paciente.nombre : delPortal ? delPortal.alias : 'Caso';
  const codigo = paciente ? paciente.codigo : delPortal ? `@${delPortal.usuario}` : '';
  const ordenadas = [...sesiones].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  // ---------- Fuentes del caso ----------
  const fuentes = useMemo(() => {
    const lista = [];
    if (paciente) {
      lista.push({
        id: 'ficha', grupo: 'Expediente', titulo: 'Ficha clínica',
        texto: [`Código: ${paciente.codigo}`, `Edad: ${paciente.edad || '—'}`, `Género: ${paciente.genero || '—'}`, `Ocupación: ${paciente.ocupacion || '—'}`,
          `Motivo de consulta: ${paciente.motivoConsulta || '—'}`, `Antecedentes: ${paciente.antecedentes || '—'}`,
          `Diagnóstico o hipótesis: ${paciente.diagnostico || '—'}`, `Frecuencia: ${paciente.frecuencia || '—'}`].join('\n'),
      });
      const notas = getPatientNotes(paciente.id).slice(0, 6);
      if (notas.length) lista.push({ id: 'notas', grupo: 'Expediente', titulo: `Notas (${notas.length})`, texto: notas.map((n) => `[${fechaCorta(n.fecha)}] ${n.tipo || 'Nota'}\n${n.contenido}`).join('\n\n') });
      const pruebas = getPatientTestResults(paciente.id).slice(0, 6);
      if (pruebas.length) lista.push({ id: 'pruebas', grupo: 'Expediente', titulo: `Pruebas (${pruebas.length})`, texto: pruebas.map((t) => `[${fechaCorta(t.fecha)}] ${t.nombreTest}: ${t.score} puntos, ${t.severidad}. ${t.interpretacion || ''}`).join('\n') });
    }
    if (delPortal) {
      const r = delPortal.entrevista?.respuestas;
      if (r && Object.keys(r).length) lista.push({ id: 'entrevista', grupo: 'Entrevista', titulo: `Entrevista inicial${delPortal.entrevista.completada ? '' : ' (en progreso)'}`, texto: entrevistaComoTexto(r) });
      lista.push({ id: 'consentimiento', grupo: 'Entrevista', titulo: 'Consentimiento', texto: delPortal.consentimiento ? `Firmó el consentimiento informado el ${fechaCorta(delPortal.consentimiento.aceptado_en)}.` : 'Todavía no firma el consentimiento informado.' });
    }
    // Sesiones: resumen de todas; transcripción completa solo de las 3 más recientes (para no exceder el límite)
    const recientes = new Set(ordenadas.slice(-3).map((s) => s.id));
    ordenadas.forEach((s, i) => lista.push({
      id: `ses:${s.id}`, grupo: 'Sesiones', titulo: `Sesión ${i + 1} · ${fechaCorta(s.fecha)}`, sesion: s,
      texto: [`Sesión ${i + 1} (${fechaCorta(s.fecha)}) — ${s.titulo}`, s.resumen ? `Resumen: ${s.resumen}` : '', recientes.has(s.id) || !s.resumen ? `Transcripción:\n${(s.transcripcion || '').slice(0, 9000)}` : ''].filter(Boolean).join('\n'),
    }));
    docs.forEach((d) => lista.push({ id: `doc:${d.id}`, grupo: 'Documentos', titulo: d.titulo, texto: d.texto, doc: true }));
    return lista;
  }, [paciente, delPortal, docs, sesiones]); // eslint-disable-line react-hooks/exhaustive-deps

  const reemplazos = [
    paciente && { nombre: paciente.nombre, codigo: paciente.codigo },
    delPortal && { nombre: delPortal.entrevista?.respuestas?.nombre_preferido, codigo: delPortal.alias },
    delPortal && { nombre: delPortal.consentimiento?.nombre_firma, codigo: delPortal.alias },
  ].filter((x) => x && x.nombre);

  const limpiar = (t) => (ajustes.desidentificar ? desidentificar(t, reemplazos) : t);
  const textoFuentes = (soloIds) => limpiar(
    fuentes.filter((f) => (soloIds ? soloIds.includes(f.id) : elegidas[f.id] !== false)).map((f) => `### ${f.titulo}\n${f.texto}`).join('\n\n').slice(0, 45000),
  );
  const sistema = (soloIds) => armarSistema(ajustes, textoFuentes(soloIds));

  /** Pregunta al asistente con las fuentes del caso. `historial` son mensajes previos {role, content}. */
  const preguntar = (pregunta, { historial = [], soloIds } = {}) => preguntarIA({
    sistema: sistema(soloIds),
    mensajes: [...historial, { role: 'user', content: limpiar(pregunta) }].map(({ role, content }) => ({ role, content })),
    clave: ajustes.clave,
  });

  /** Para pegar en Claude u otro asistente cuando Cloudflare no está conectado. */
  const comoPrompt = (pregunta, soloIds) => `${sistema(soloIds)}\n\nPREGUNTA:\n${limpiar(pregunta || '(escribe aquí tu pregunta)')}`;

  // ---------- Acciones ----------
  const guardarSesion = (datos) => {
    const s = { id: datos.id || nuevoId(), creada: datos.creada || new Date().toISOString(), ...datos };
    setSesiones(sesiones.some((x) => x.id === s.id) ? sesiones.map((x) => (x.id === s.id ? s : x)) : [...sesiones, s]);
    return s;
  };
  const borrarSesion = (id) => setSesiones(sesiones.filter((s) => s.id !== id));
  const agregarDoc = (titulo, texto) => { const d = { id: nuevoId(), titulo: titulo || 'Documento', texto }; setDocs([...docs, d]); return d; };
  const quitarDoc = (id) => setDocs(docs.filter((d) => d.id !== id));

  return {
    caso, ajustes, setAjustes, paciente, delPortal, nombre, codigo,
    fuentes, elegidas, setElegidas, docs, sesiones: ordenadas, chat, setChat,
    preguntar, comoPrompt, limpiar,
    guardarSesion, borrarSesion, agregarDoc, quitarDoc,
  };
}
