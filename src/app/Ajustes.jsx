import React, { useState } from 'react';
import { LogOut, Link2, Copy } from 'lucide-react';
import { getPerfil, savePerfil } from '../utils/storage';
import { useAviso } from './aviso';
import { Pantalla, Seccion, Campo, inp, btnSec } from './ui';
import { EstadoGuardado } from './Navegacion';

/** Ajustes de la app: tus datos para los documentos, el link de tus consultantes y el candado. */
export default function Ajustes({ therapist, estado, onSalir }) {
  const aviso = useAviso();
  const [perfil, setPerfilS] = useState(getPerfil);
  const cambiar = (k) => (e) => { const p = { ...perfil, [k]: e.target.value }; setPerfilS(p); savePerfil(p); };
  const link = `${window.location.origin}${window.location.pathname}#consultante`;

  return (
    <Pantalla grande titulo="Ajustes" ancho="max-w-xl">
      <div className="space-y-6">
        <Seccion titulo="Tus datos" nota="Firman tus informes">
          <div className="p-4 space-y-4">
            <Campo etiqueta="Nombre"><input value={perfil.nombre || ''} onChange={cambiar('nombre')} autoComplete="name" className={inp} /></Campo>
            <Campo etiqueta="Cédula profesional"><input value={perfil.cedula || ''} onChange={cambiar('cedula')} className={inp} /></Campo>
          </div>
        </Seccion>
        <Seccion titulo="Acceso de consultantes">
          <div className="p-4 space-y-3">
            <p className="flex items-center gap-2 text-[13.5px] text-zinc-400 break-all"><Link2 size={15} className="shrink-0 text-zinc-500" />{link}</p>
            <button type="button" onClick={() => navigator.clipboard?.writeText(link).then(() => aviso('Link copiado'))} className={btnSec}><Copy size={15} /> Copiar link</button>
          </div>
        </Seccion>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EstadoGuardado estado={estado} />
          <button type="button" onClick={onSalir} className={btnSec}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </div>
    </Pantalla>
  );
}
