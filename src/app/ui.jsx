/**
 * ui.jsx
 * Piezas compartidas de las pantallas: encabezado con "atrás", sub-pestañas, filas que llevan a un detalle,
 * secciones y campos. Todo con la misma medida para que la app se sienta una sola.
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRuta, vt, conTransiciones } from './rutas';

export const inp = 'h-11 w-full rounded-xl bg-raised border border-line focus:border-emerald-400/60 outline-none px-3 text-[15px] text-ink placeholder:text-zinc-600';
export const area = 'w-full rounded-xl bg-raised border border-line focus:border-emerald-400/60 outline-none p-3 text-[15px] leading-relaxed text-ink placeholder:text-zinc-600 resize-y';
export const btnPri = 'h-11 px-5 rounded-xl text-[14px] font-semibold bg-emerald-400 hover:bg-emerald-300 text-emerald-950 disabled:opacity-40 disabled:active:scale-100 inline-flex items-center justify-center gap-2 transition duration-150 active:scale-[.97]';
export const btnSec = 'h-11 px-4 rounded-xl text-[14px] text-zinc-300 bg-raised ring-1 ring-line/60 hover:text-ink hover:ring-line inline-flex items-center justify-center gap-2 transition duration-150 active:scale-[.97] disabled:opacity-40';
export const btnTxt = 'h-10 px-3 rounded-lg text-[13.5px] text-zinc-400 hover:text-ink inline-flex items-center gap-2 transition duration-150 active:scale-[.97] disabled:opacity-40';

// Animación de respaldo cuando el navegador no tiene View Transitions
const ENTRADA = { adelante: 'animate-entrar-derecha', atras: 'animate-entrar-izquierda', lateral: 'animate-entrada' };

/**
 * Una pantalla de la app.
 * - `atras`: true para regresar en el historial, o una ruta "padre" si se entra directo.
 * - `grande`: título grande (pantallas principales de cada apartado).
 * - `tituloVT`: nombre de transición compartida para que el título "viaje" desde la lista.
 */
export function Pantalla({ titulo, antetitulo, subtitulo, atras, etiquetaAtras = 'Atrás', grande = false, tituloVT, acciones, children, ancho = 'max-w-5xl' }) {
  const { dir, atras: regresar } = useRuta();
  return (
    <div className={`${ancho} w-full mx-auto ${conTransiciones ? '' : ENTRADA[dir] || ''}`}>
      {atras && (
        <button type="button" onClick={() => regresar(atras === true ? undefined : atras)}
          className="-ml-2 mb-3 h-9 pl-1 pr-3 rounded-lg inline-flex items-center gap-1 text-[14px] text-zinc-400 hover:text-ink transition-colors">
          <ChevronLeft size={18} /> {etiquetaAtras}
        </button>
      )}
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-6">
        <div className="min-w-0">
          {antetitulo && <p className="text-[12px] uppercase tracking-[0.09em] text-zinc-500 mb-1">{antetitulo}</p>}
          <h1 style={vt(tituloVT)} className={grande ? 'font-display text-[36px] xs:text-[46px] leading-[1.02] text-ink' : 'text-[24px] xs:text-[28px] font-semibold tracking-tight text-ink leading-tight w-fit'}>
            {titulo}
          </h1>
          {subtitulo && <div className="text-[13.5px] text-zinc-500 mt-1.5">{subtitulo}</div>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </header>
      {children}
    </div>
  );
}

/** Sub-pestañas de un apartado. El indicador se desliza de una a otra. */
export function Subtabs({ items, activo, onCambio }) {
  return (
    <nav className="flex gap-1 p-1 rounded-xl bg-surface border border-line w-fit max-w-full overflow-x-auto no-scrollbar mb-6" aria-label="Secciones">
      {items.map(({ id, label, cuenta }) => {
        const esta = id === activo;
        return (
          <button key={id} type="button" onClick={() => onCambio(id)} aria-current={esta ? 'page' : undefined}
            className={`relative shrink-0 h-9 px-4 rounded-lg text-[13.5px] transition-colors ${esta ? 'text-ink' : 'text-zinc-500 hover:text-ink'}`}>
            {esta && <span style={vt('indicador-sub')} className="absolute inset-0 rounded-lg bg-raised ring-1 ring-line" aria-hidden="true" />}
            <span className="relative">{label}{cuenta != null && <span className="ml-1.5 text-zinc-500 tabular">{cuenta}</span>}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Bloque con título opcional. */
export function Seccion({ titulo, nota, accion, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface ${className}`}>
      {(titulo || accion) && (
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 min-h-12 py-2 border-b border-line">
          <div className="flex items-baseline gap-2 min-w-0">
            {titulo && <h2 className="text-[14.5px] font-semibold text-ink">{titulo}</h2>}
            {nota && <span className="text-[12.5px] text-zinc-500 truncate">{nota}</span>}
          </div>
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}

/** Fila que lleva a otra pantalla. `derecha` va antes de la flecha. */
export function FilaEnlace({ onClick, children, derecha, sinFlecha = false }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-white/[0.025] active:bg-white/[0.04] transition-colors">
      <div className="flex-1 min-w-0">{children}</div>
      {derecha}
      {!sinFlecha && <ChevronRight size={17} className="text-zinc-600 shrink-0" />}
    </button>
  );
}

/** Estado vacío. Con `titulo` (y opcionalmente `icono` y `accion`) se muestra como bloque centrado que explica qué hacer. */
export function Vacio({ children, titulo, icono: Icono, accion }) {
  if (!titulo) return <p className="px-4 py-6 text-[14px] text-zinc-500">{children}</p>;
  return (
    <div className="px-6 py-10 flex flex-col items-center text-center gap-3">
      {Icono && <span className="w-11 h-11 rounded-2xl bg-raised ring-1 ring-line grid place-items-center text-zinc-400"><Icono size={19} /></span>}
      <p className="text-[15px] font-medium text-ink">{titulo}</p>
      {children && <p className="text-[13.5px] text-zinc-500 max-w-sm leading-relaxed">{children}</p>}
      {accion && <div className="pt-1">{accion}</div>}
    </div>
  );
}

export function Campo({ etiqueta, ayuda, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-[13px] text-zinc-400 ${className}`}>
      {etiqueta}
      {children}
      {ayuda && <span className="text-[12px] text-zinc-600">{ayuda}</span>}
    </label>
  );
}

/** Confirmación dentro de la pantalla (sin ventanas emergentes). */
export function Confirmar({ pregunta, siTexto = 'Sí, quitar', onSi, onNo }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.07] p-4 space-y-3">
      <p className="text-[14px] text-rose-100">{pregunta}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onSi} className="h-10 px-4 rounded-xl text-[13.5px] font-semibold bg-rose-400/90 text-rose-950">{siTexto}</button>
        <button type="button" onClick={onNo} className={btnTxt}>Cancelar</button>
      </div>
    </div>
  );
}
