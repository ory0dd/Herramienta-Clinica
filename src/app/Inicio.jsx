import React from 'react';
import { UserRound, Stethoscope, ChevronRight } from 'lucide-react';
import { elegirModo } from './modo';
import { NOMBRE } from '../data/marca';

const LADOS = [
  { id: 'consultante', icono: UserRound, titulo: 'Consultante', texto: 'Consentimiento y entrevista' },
  { id: 'clinico', icono: Stethoscope, titulo: 'Clínico', texto: 'Agenda, expedientes y cuadernos' },
];

/** Pantalla de entrada: cada quien elige su lado. */
export default function Inicio() {
  return (
    <div className="min-h-screen bg-base text-ink font-sans flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm animate-entrada">
        <div className="flex flex-col items-center text-center mb-10">
          <span className="font-display text-[56px] leading-none text-emerald-300" aria-hidden="true">Ψ</span>
          <h1 className="font-display text-[40px] leading-tight mt-2">{NOMBRE}</h1>
          <p className="text-[14px] text-zinc-500 mt-1">¿Cómo entras?</p>
        </div>
        <div className="space-y-3">
          {LADOS.map(({ id, icono: I, titulo, texto }) => (
            <button key={id} type="button" onClick={() => elegirModo(id)}
              className="w-full flex items-center gap-4 rounded-2xl bg-surface ring-1 ring-line hover:ring-zinc-600 px-4 py-4 text-left transition active:scale-[.98]">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-raised ring-1 ring-line grid place-items-center text-emerald-300"><I size={20} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-[16px] font-medium text-ink">{titulo}</span>
                <span className="block text-[13px] text-zinc-500 mt-0.5">{texto}</span>
              </span>
              <ChevronRight size={18} className="text-zinc-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
