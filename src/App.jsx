import React, { useState, useEffect } from 'react';
import PortalConsultante from './components/PortalConsultante';
import { RutaProvider, useRuta, vt } from './app/rutas';
import Navegacion from './app/Navegacion';
import Agenda from './app/agenda/Agenda';
import Consultantes from './app/consultantes/Consultantes';
import Entrevistas from './app/entrevistas/Entrevistas';
import Cuadernos from './app/cuadernos/Cuadernos';
import { AvisoProvider } from './app/aviso';
import Pruebas from './app/pruebas/Pruebas';
import Ajustes from './app/Ajustes';
import Candado from './app/Candado';
import Inicio from './app/Inicio';
import { modoGuardado, volverAlInicio } from './app/modo';
import {
  hayNube, sesionTerapeuta, terapeutaDesdeUsuario, bajarDatos, activarSincronizacion,
  salirNube, borrarCopiaLocal, escucharNube, estadoNube,
} from './utils/nube';
import { setActiveTherapist, getActiveTherapist, logoutTherapist, getPatients } from './utils/storage';

// Al abrir, cada quien elige su lado: #consultante es el portal; #/agenda/… es el consultorio.
// La elección se recuerda en este dispositivo.
const ladoActual = () => {
  const h = window.location.hash;
  if (h === '#consultante') return 'consultante';
  if (h.startsWith('#/')) return 'clinico';
  return modoGuardado() || 'inicio';
};

export default function App() {
  const [lado, setLado] = useState(ladoActual);
  useEffect(() => {
    const f = () => setLado(ladoActual());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  if (lado === 'inicio') return <Inicio />;
  if (lado === 'consultante') return <PortalConsultante />;
  return (
    <RutaProvider inicial={['agenda', 'hoy']}>
      <AvisoProvider>
        <Consultorio />
      </AvisoProvider>
    </RutaProvider>
  );
}

function Consultorio() {
  const { ruta, navegar } = useRuta();
  const [therapist, setTherapist] = useState(getActiveTherapist);
  const [patients, setPatients] = useState(getPatients);
  const [pacientePrueba, setPacientePrueba] = useState(null);
  const [nubeEstado, setNubeEstado] = useState(() => estadoNube().estado);
  // Demostración: recorrer la app con datos de ejemplo, sin cuenta. Nada llega a la base de datos.
  const [demo, setDemo] = useState(() => { try { return sessionStorage.getItem('aniima_demo') === '1'; } catch (_) { return false; } });
  const marcarDemo = (v) => { try { if (v) sessionStorage.setItem('aniima_demo', '1'); else sessionStorage.removeItem('aniima_demo'); } catch (_) { /* nada */ } setDemo(v); };

  const refrescar = () => setPatients(getPatients());
  const entrar = (t) => { setTherapist(t); refrescar(); };

  useEffect(() => escucharNube((e) => setNubeEstado(e)), []);

  // Al cargar: si había una sesión de terapeuta en Supabase, la recupera y trae sus datos
  useEffect(() => {
    if (!hayNube) return;
    (async () => {
      const usuario = await sesionTerapeuta().catch(() => null);
      const guardado = getActiveTherapist();
      if (usuario) {
        const t = terapeutaDesdeUsuario(usuario);
        setActiveTherapist(t);
        activarSincronizacion(true);
        await bajarDatos(t.id).catch(() => {});
        entrar(t);
      } else if (guardado?.nube) {
        // La sesión venció: no dejar datos de esa cuenta en este navegador
        borrarCopiaLocal(guardado.id);
        logoutTherapist();
        entrar(getActiveTherapist());
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const salir = async () => {
    marcarDemo(false);
    const saliente = getActiveTherapist();
    if (saliente?.nube) {
      await salirNube();
      borrarCopiaLocal(saliente.id);
    }
    logoutTherapist();
    entrar(getActiveTherapist());
    volverAlInicio();
  };

  const abrirAsistente = (x) => navegar(['cuadernos', x.codigo ? `exp:${x.id}` : `pt:${x.id}`]);
  const aplicarPrueba = (p) => { setPacientePrueba(p); navegar(['pruebas']); };

  const [a, b, c, d, e] = ruta;
  const llave = therapist?.id || 'anon';
  let pantalla;
  switch (a) {
    case 'consultantes':
      pantalla = <Consultantes key={llave} id={b} sub={c} extra={d} extra2={e} onCambio={refrescar} onAbrirAsistente={abrirAsistente} onAplicarPrueba={aplicarPrueba} />;
      break;
    case 'entrevistas':
      pantalla = <Entrevistas key={llave} id={b} sub={c} therapist={therapist} patients={patients} onCambio={refrescar} onAbrirAsistente={abrirAsistente} />;
      break;
    case 'asistente': // ruta vieja
    case 'cuadernos':
      pantalla = <Cuadernos key={llave} caso={a === 'cuadernos' ? b : undefined} vista={c} param={d} extra={e} patients={patients} therapist={therapist} />;
      break;
    case 'pruebas':
      pantalla = <Pruebas key={llave} testId={b} patients={patients} pacienteInicial={pacientePrueba} />;
      break;
    case 'ajustes':
    case 'cuenta': // ruta vieja
      pantalla = <Ajustes therapist={therapist} estado={nubeEstado} onSalir={salir} />;
      break;
    default:
      pantalla = <Agenda key={llave} sub={b} param={c} extra={d} />;
  }

  // Con base de datos, el consultorio es solo de su dueña: sin sesión se muestra el candado
  const enDemo = demo && !therapist?.nube;
  if (hayNube && !therapist?.nube && !demo) {
    return <Candado onEntrar={(t) => { marcarDemo(false); entrar(t); navegar(['agenda', 'hoy'], { reemplazar: true }); }}
      onDemo={() => { logoutTherapist(); entrar(getActiveTherapist()); marcarDemo(true); navegar(['agenda', 'hoy'], { reemplazar: true }); }} />;
  }

  return (
    <div className="min-h-screen bg-base text-ink font-sans lg:flex">
      <Navegacion therapist={therapist} estado={nubeEstado} onSalir={salir} />
      <main style={vt('contenido')} className="flex-1 min-w-0 px-4 xs:px-5 sm:px-8 lg:px-12 pt-5 lg:pt-10 pb-28 bajo:pb-20 lg:pb-12">
        {enDemo && (
          <div className="max-w-5xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <p className="text-[13px] text-amber-200">Demostración con datos de ejemplo. Nada se guarda en el consultorio.</p>
            <button type="button" onClick={salir} className="text-[13px] font-medium text-amber-100 hover:text-ink">Salir</button>
          </div>
        )}
        {pantalla}
      </main>
    </div>
  );
}
