/**
 * aviso.jsx
 * Avisos breves que confirman una acción ("Guardado", "Copiado", "Cambios aplicados").
 * Aparecen abajo, sobre la barra de apartados, y se van solos.
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';

const Ctx = createContext(() => {});

export function AvisoProvider({ children }) {
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef(null);
  const mostrar = useCallback((texto, tono = 'ok') => {
    clearTimeout(temporizador.current);
    setAviso({ texto, tono, id: Date.now() });
    temporizador.current = setTimeout(() => setAviso(null), 2400);
  }, []);
  return (
    <Ctx.Provider value={mostrar}>
      {children}
      <div aria-live="polite" role="status" className="fixed z-50 inset-x-0 bottom-[136px] bajo:bottom-[112px] lg:bottom-24 flex justify-center pointer-events-none px-4">
        {aviso && (
          <span key={aviso.id} className={`animate-aviso inline-flex items-center gap-2 rounded-full px-4 h-10 text-[13.5px] font-medium shadow-lg ring-1 ${aviso.tono === 'error' ? 'bg-rose-950 text-rose-100 ring-rose-500/40' : 'bg-raised text-ink ring-line'}`}>
            {aviso.tono === 'error' ? <AlertCircle size={15} className="text-rose-300" /> : <Check size={15} className="text-emerald-300" />}
            {aviso.texto}
          </span>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useAviso = () => useContext(Ctx);
