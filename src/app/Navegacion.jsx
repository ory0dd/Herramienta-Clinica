import React from 'react';
import { CalendarDays, ClipboardList, Users, BookOpen, Activity, Settings2, LogOut } from 'lucide-react';
import { useRuta, vt } from './rutas';

// Cinco apartados, en el orden en que se usan durante el día. `inicio` es la pantalla al tocarlos.
export const APARTADOS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays, inicio: ['agenda', 'hoy'] },
  { id: 'consultantes', label: 'Consultantes', icon: Users, inicio: ['consultantes'] },
  { id: 'entrevistas', label: 'Entrevistas', icon: ClipboardList, inicio: ['entrevistas'] },
  { id: 'cuadernos', label: 'Cuadernos', icon: BookOpen, inicio: ['cuadernos'] },
  { id: 'pruebas', label: 'Pruebas', icon: Activity, inicio: ['pruebas'] },
];

const ESTADOS = {
  'sin-nube': { punto: 'bg-zinc-600', texto: 'Solo en este navegador' },
  local: { punto: 'bg-amber-400', texto: 'Base conectada' },
  guardando: { punto: 'bg-sky-400 animate-pulse', texto: 'Guardando…' },
  guardado: { punto: 'bg-emerald-400', texto: 'Guardado' },
  error: { punto: 'bg-rose-400', texto: 'Sin conexión · se reintentará' },
};

export function EstadoGuardado({ estado }) {
  const e = ESTADOS[estado] || ESTADOS['sin-nube'];
  return (
    <span className="flex items-center gap-2 text-[12.5px] text-zinc-500">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${e.punto}`} />{e.texto}
    </span>
  );
}

function Marca() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="font-display text-[26px] leading-none text-emerald-300" aria-hidden="true">Ψ</span>
      <span className="text-[14px] font-semibold text-ink tracking-tight whitespace-nowrap">Oasis Clínico</span>
    </span>
  );
}

export default function Navegacion({ estado, onSalir }) {
  const { ruta, navegar } = useRuta();
  const actual = ruta[0];
  const ir = (a) => navegar(a.inicio);
  const enAjustes = actual === 'ajustes';

  return (
    <>
      {/* Escritorio: barra lateral */}
      <aside className="hidden lg:flex lg:flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-line px-3 py-6" style={vt('navegacion')}>
        <button type="button" onClick={() => navegar(['agenda', 'hoy'])} className="px-3 text-left"><Marca /></button>
        <nav className="mt-8 flex-1" aria-label="Apartados">
          <ul className="space-y-0.5">
            {APARTADOS.map((a) => {
              const activo = a.id === actual;
              const Icono = a.icon;
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => ir(a)} aria-current={activo ? 'page' : undefined}
                    className={`relative w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[14px] transition-colors ${activo ? 'text-ink' : 'text-zinc-500 hover:text-ink'}`}>
                    {activo && <span style={vt('indicador-nav')} className="absolute inset-0 rounded-xl bg-raised" aria-hidden="true" />}
                    <Icono size={17} className={`relative ${activo ? 'text-emerald-300' : ''}`} />
                    <span className="relative">{a.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-1 flex items-center justify-between gap-2">
          <span className="px-2"><EstadoGuardado estado={estado} /></span>
          <button type="button" onClick={() => navegar(['ajustes'])} aria-label="Ajustes" title="Ajustes" aria-current={enAjustes ? 'page' : undefined}
            className={`w-9 h-9 grid place-items-center rounded-xl transition-colors ${enAjustes ? 'bg-raised text-ink' : 'text-zinc-500 hover:text-ink'}`}><Settings2 size={17} /></button>
        </div>
        <button type="button" onClick={onSalir} className="mt-2 w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[14px] text-zinc-500 hover:text-ink hover:bg-white/[0.03] transition-colors">
          <LogOut size={17} /> Cerrar sesión
        </button>
      </aside>

      {/* Celular: barra superior mínima */}
      <header className="lg:hidden sticky top-0 bajo:static z-30 bg-base border-b border-line" style={vt('barra-superior')}>
        <div className="flex items-center justify-between gap-2 px-4 h-12" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button type="button" onClick={() => navegar(['agenda', 'hoy'])}><Marca /></button>
          <span className="flex items-center -mr-1.5">
            <button type="button" onClick={() => navegar(['ajustes'])} aria-label="Ajustes"
              className={`w-9 h-9 grid place-items-center rounded-full transition-colors ${enAjustes ? 'bg-raised text-ink' : 'text-zinc-400'}`}><Settings2 size={18} /></button>
            <button type="button" onClick={onSalir} aria-label="Cerrar sesión" title="Cerrar sesión"
              className="w-9 h-9 grid place-items-center rounded-full text-zinc-400 hover:text-ink transition-colors"><LogOut size={18} /></button>
          </span>
        </div>
      </header>

      {/* Celular: barra inferior de apartados */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-base border-t border-line" style={{ ...vt('barra-inferior'), paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Apartados">
        <ul className="grid grid-cols-5 h-[60px] bajo:h-[50px] px-1">
          {APARTADOS.map((a) => {
            const activo = a.id === actual;
            const Icono = a.icon;
            return (
              <li key={a.id}>
                <button type="button" onClick={() => ir(a)} aria-current={activo ? 'page' : undefined}
                  className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors ${activo ? 'text-ink' : 'text-zinc-500'}`}>
                  <span className="relative grid place-items-center w-12 h-7 bajo:h-6">
                    {activo && <span style={vt('indicador-nav-movil')} className="absolute inset-0 rounded-full bg-emerald-400/15" aria-hidden="true" />}
                    <Icono size={19} className={`relative ${activo ? 'text-emerald-300' : ''}`} />
                  </span>
                  <span className="hidden xs:block bajo:hidden text-[10.5px] leading-none">{a.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
