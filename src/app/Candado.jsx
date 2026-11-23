import React, { useState } from 'react';
import { ArrowRight, Lock, ChevronLeft } from 'lucide-react';
import { setActiveTherapist } from '../utils/storage';
import { entrarTerapeuta, terapeutaDesdeUsuario, bajarDatos, activarSincronizacion } from '../utils/nube';
import { Campo, inp, btnPri } from './ui';
import { volverAlInicio } from './modo';

/** Candado de la app: solo la dueña entra al consultorio. Los consultantes tienen su propio acceso. */
export default function Candado({ onEntrar, onDemo }) {
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!f.email || !f.password) return setError('Escribe tu correo y contraseña.');
    setError('');
    setCargando(true);
    try {
      const t = terapeutaDesdeUsuario(await entrarTerapeuta(f));
      setActiveTherapist(t);
      activarSincronizacion(true);
      await bajarDatos(t.id);
      onEntrar(t);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-base text-ink font-sans grid place-items-center px-5 py-10">
      <button type="button" onClick={volverAlInicio}
        className="fixed left-3 top-3 h-9 pl-1 pr-3 rounded-lg inline-flex items-center gap-1 text-[14px] text-zinc-400 hover:text-ink transition-colors" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
        <ChevronLeft size={18} /> Inicio
      </button>
      <form onSubmit={enviar} className="w-full max-w-sm space-y-5 animate-entrada">
        <div className="flex flex-col items-center text-center gap-3 mb-2">
          <span className="w-12 h-12 rounded-2xl bg-surface ring-1 ring-line grid place-items-center text-emerald-300"><Lock size={20} /></span>
          <h1 className="font-display text-[38px] leading-none">Tu consultorio</h1>
        </div>
        <Campo etiqueta="Correo"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" className={inp} /></Campo>
        <Campo etiqueta="Contraseña"><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" className={inp} /></Campo>
        {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-[13.5px] text-rose-200">{error}</p>}
        <button type="submit" disabled={cargando} className={`${btnPri} w-full`}>{cargando ? 'Abriendo…' : 'Entrar'} <ArrowRight size={16} /></button>
        {onDemo && (
          <button type="button" onClick={onDemo} className="w-full h-11 rounded-full text-[14px] text-zinc-300 ring-1 ring-line hover:text-ink hover:ring-zinc-700 transition active:scale-[.98]">
            Ver demostración sin cuenta
          </button>
        )}
      </form>
    </div>
  );
}
