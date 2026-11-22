import React, { useEffect, useState } from 'react';
import { Printer, AudioLines } from 'lucide-react';
import { urlAudioConsentimiento } from '../utils/portal';
import { CONSENTIMIENTO } from '../data/consentimiento';

const fechaLarga = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Hoja de documento: en pantalla se ve como papel; al imprimir (o "Guardar como PDF") sale solo la hoja.
 */
export function Documento({ titulo, datos = [], children, pie }) {
  return (
    <article className="imprimible rounded-2xl bg-[#f7f6f3] text-[#1d1d1f] px-6 py-8 sm:px-10 sm:py-12 shadow-sm">
      <header className="border-b border-black/15 pb-5 mb-6">
        <h2 className="font-display text-[30px] leading-tight">{titulo}</h2>
        {datos.length > 0 && (
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
            {datos.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="inline text-black/55">{k}: </dt><dd className="inline">{v}</dd></div>)}
          </dl>
        )}
      </header>
      <div className="text-[14.5px] leading-relaxed space-y-4">{children}</div>
      {pie && <footer className="mt-10 pt-5 border-t border-black/15 text-[12.5px] text-black/60">{pie}</footer>}
    </article>
  );
}

export function BotonImprimir({ etiqueta = 'Imprimir o guardar como PDF', className = '' }) {
  return (
    <button type="button" onClick={() => window.print()}
      className={`h-11 px-4 rounded-xl text-[14px] text-zinc-300 bg-raised hover:text-ink inline-flex items-center justify-center gap-2 transition-colors ${className}`}>
      <Printer size={16} /> {etiqueta}
    </button>
  );
}

/** Constancia del consentimiento informado firmado. */
export function ConstanciaConsentimiento({ alias, consentimiento }) {
  return (
    <Documento
      titulo="Constancia de consentimiento informado"
      datos={[['Consultante', alias], ['Firmado por', consentimiento.nombre_firma], ['Fecha', fechaLarga(consentimiento.aceptado_en)], ['Versión', consentimiento.version], ['Confirmación', consentimiento.metodo === 'audio' ? 'Con su voz (audio guardado)' : 'Nombre escrito']]}
      pie={`Aceptado en línea el ${fechaLarga(consentimiento.aceptado_en)}. Esta constancia reproduce el texto de la versión ${consentimiento.version} del consentimiento.`}
    >
      <p>{CONSENTIMIENTO.introduccion}</p>
      {CONSENTIMIENTO.puntos.map((p) => (
        <section key={p.id}>
          <h3 className="font-semibold">{p.titulo}</h3>
          <p>{p.texto}</p>
        </section>
      ))}
      <p className="pt-4">{CONSENTIMIENTO.firma}</p>
      <p className="pt-6"><span className="inline-block min-w-[260px] border-b border-black/40 pb-1 font-display text-[22px]">{consentimiento.nombre_firma}</span><br /><span className="text-[12.5px] text-black/55">Nombre de quien firma</span></p>
    </Documento>
  );
}

/** Reproductor del audio con el que se confirmó el consentimiento (si se confirmó así). */
export function AudioConsentimiento({ consentimiento }) {
  const [url, setUrl] = useState(consentimiento?.audioUrl || null);
  useEffect(() => {
    if (consentimiento?.audioUrl || !consentimiento?.audio) return;
    urlAudioConsentimiento(consentimiento.audio).then(setUrl).catch(() => {});
  }, [consentimiento?.audio, consentimiento?.audioUrl]);
  if (consentimiento?.metodo !== 'audio') return null;
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-line p-4 space-y-3">
      <p className="flex items-center gap-2 text-[14px] text-ink"><AudioLines size={16} className="text-emerald-300" /> Confirmado con su voz</p>
      {url ? <audio controls src={url} className="w-full h-10" /> : <p className="text-[13px] text-zinc-500">Cargando audio…</p>}
    </div>
  );
}
