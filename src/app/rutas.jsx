/**
 * rutas.jsx
 * Navegación de la app por pantallas: cada pantalla tiene su dirección (#/agenda/personas/l-01),
 * funciona el botón de atrás del teléfono y el paso entre pantallas se anima:
 *   - adelante (entrar a un detalle): la pantalla nueva llega desde la derecha
 *   - atrás: regresa desde la izquierda
 *   - lateral (cambiar de apartado): fundido suave
 * Usa View Transitions del navegador cuando existen; si no, una animación CSS equivalente.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

const Ctx = createContext(null);

export const conTransiciones = typeof document !== 'undefined' && 'startViewTransition' in document;
const movimientoReducido = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const aSegmentos = (r) => (Array.isArray(r) ? r : String(r).replace(/^#?\/?/, '').split('/')).filter(Boolean).map(String);
const aHash = (segs) => `#/${segs.map(encodeURIComponent).join('/')}`;
const leerHash = () => {
  const h = window.location.hash || '';
  if (!h.startsWith('#/')) return null;
  return h.slice(2).split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch (_) { return s; } });
};

function direccionEntre(vieja, nueva) {
  if (vieja[0] !== nueva[0]) return 'lateral';
  if (nueva.length > vieja.length) return 'adelante';
  if (nueva.length < vieja.length) return 'atras';
  return 'lateral';
}

export function RutaProvider({ inicial = ['agenda'], children }) {
  const [ruta, setRuta] = useState(() => leerHash()?.length ? leerHash() : inicial);
  const [dir, setDir] = useState('lateral');
  const rutaRef = useRef(ruta);
  const pila = useRef(1); // pantallas que esta sesión agregó al historial

  const mostrar = useCallback((nueva, d) => {
    const hacer = () => {
      flushSync(() => { setDir(d); setRuta(nueva); });
      rutaRef.current = nueva;
      window.scrollTo(0, 0);
    };
    document.documentElement.dataset.dir = d;
    if (conTransiciones && !movimientoReducido()) document.startViewTransition(hacer);
    else hacer();
  }, []);

  const navegar = useCallback((destino, { reemplazar = false } = {}) => {
    const nueva = aSegmentos(destino);
    const vieja = rutaRef.current;
    if (nueva.join('/') === vieja.join('/')) return;
    try {
      if (reemplazar) window.history.replaceState(null, '', aHash(nueva));
      else { window.history.pushState(null, '', aHash(nueva)); pila.current += 1; }
    } catch (_) { /* algunos visores no permiten cambiar la dirección */ }
    mostrar(nueva, direccionEntre(vieja, nueva));
  }, [mostrar]);

  /** Regresa: con el historial si venimos de otra pantalla de la app; si no, a la pantalla "padre". */
  const atras = useCallback((padre) => {
    if (pila.current > 1) {
      try { window.history.back(); return; } catch (_) { /* sigue abajo */ }
    }
    const destino = padre ? aSegmentos(padre) : rutaRef.current.slice(0, -1);
    navegar(destino.length ? destino : ['agenda'], { reemplazar: true });
  }, [navegar]);

  // Al abrir la app sin dirección, deja escrita la de inicio (para compartir el link o recargar)
  useEffect(() => {
    if (!leerHash()) { try { window.history.replaceState(null, '', aHash(rutaRef.current)); } catch (_) { /* visor sin historial */ } }
  }, []);

  useEffect(() => {
    const alCambiar = () => {
      pila.current = Math.max(1, pila.current - 1);
      const nueva = leerHash();
      if (!nueva || !nueva.length || nueva.join('/') === rutaRef.current.join('/')) return;
      mostrar(nueva, direccionEntre(rutaRef.current, nueva));
    };
    window.addEventListener('popstate', alCambiar);
    return () => window.removeEventListener('popstate', alCambiar);
  }, [mostrar]);

  return <Ctx.Provider value={{ ruta, dir, navegar, atras }}>{children}</Ctx.Provider>;
}

export const useRuta = () => useContext(Ctx);

/** Nombre de transición compartida: el mismo elemento "viaja" de una pantalla a otra (ej. el nombre de una lista al título del detalle). */
export const vt = (nombre) => (conTransiciones && nombre ? { viewTransitionName: String(nombre).replace(/[^a-zA-Z0-9_-]/g, '-') } : undefined);

/**
 * Anima un cambio dentro de la misma pantalla (ej. pasar a la siguiente pregunta).
 * El elemento que cambia debe llevar `style={vt('paso')}` para deslizarse solo él; `todo` desliza la pantalla entera.
 */
export function animar(cambio, direccion = 'adelante', todo = false) {
  const hacer = () => flushSync(cambio);
  // Solo el paso se desliza (`adelante-paso`), salvo que cambie toda la pantalla (`todo`)
  document.documentElement.dataset.dir = todo ? direccion : `${direccion}-paso`;
  if (conTransiciones && !movimientoReducido()) document.startViewTransition(hacer);
  else hacer();
}
