/**
 * useAgenda.js
 * Estado compartido de la Agenda (personas, pagos y ajustes) para todas sus pantallas.
 * La fuente de verdad es el almacenamiento (navegador y, si hay sesión, Supabase).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  armarVista, acciones, rellenarMensaje, getLista, saveLista, getPagos, savePagos, getAjustes, saveAjustes,
} from '../../utils/miLista';

export const MENSAJE_PREGUNTAR = '¡Hola! Espero que estés muy bien. ¿Qué día y hora te acomodan para tu siguiente sesión? 🙂';
export const nuevoId = () => `l-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
// Número para WhatsApp: solo dígitos y con lada de país (10 dígitos se toman como México, 52)
export const numeroWhatsApp = (t) => {
  const d = (t || '').replace(/\D/g, '');
  if (d.length === 10) return `52${d}`;
  return d.length >= 11 ? d : '';
};

export function useAgenda() {
  const [lista, setListaState] = useState(getLista);
  const [pagos, setPagosState] = useState(getPagos);
  const [ajustes, setAjustesState] = useState(getAjustes);
  const [ahora, setAhora] = useState(() => new Date());
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const setLista = (l) => { setListaState(l); saveLista(l); };
  const setPagos = (p) => { setPagosState(p); savePagos(p); };
  const setAjustes = (a) => { setAjustesState(a); saveAjustes(a); };

  const vista = useMemo(() => armarVista(lista, pagos, ahora), [lista, pagos, ahora]);
  const precio = parseFloat(ajustes.precio) || 0;
  const persona = (id) => lista.find((c) => c.id === id) || null;
  const filaDe = (id) => vista.filas.find((f) => f.c.id === id) || null;
  const pagoDe = (f) => pagos.find((x) => x.cliente_id === f.c.id && x.sesion === f.clave) || null;

  const actualizar = (id, campos) => {
    if (!campos || campos.error) return;
    setLista(lista.map((c) => (c.id === id ? { ...c, ...campos } : c)));
  };

  // Pago: un clic "pagó", otro clic "debe", otro clic lo quita
  const ciclarPago = (f) => {
    const p = pagoDe(f);
    if (!p) setPagos([...pagos, { id: nuevoId(), cliente_id: f.c.id, sesion: f.clave, estado: 'pagado', monto: precio || null }]);
    else if (p.estado === 'pagado') setPagos(pagos.map((x) => (x.id === p.id ? { ...x, estado: 'pendiente' } : x)));
    else setPagos(pagos.filter((x) => x.id !== p.id));
  };

  const copiar = (texto, id) => {
    navigator.clipboard?.writeText(texto).then(() => { setCopiado(id); setTimeout(() => setCopiado(''), 1500); }).catch(() => {});
  };

  const mensajeDe = (f) => (f.preguntar || !f.sesion ? MENSAJE_PREGUNTAR : rellenarMensaje(ajustes.mensaje, f.sesion));

  // Aviso: abre WhatsApp con el mensaje ya escrito, listo para enviar. Queda marcado como avisado.
  // Devuelve false si la persona no tiene número (la pantalla lleva a registrarlo).
  const avisar = (f) => {
    const tel = numeroWhatsApp(f.c.telefono);
    if (!tel) return false;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensajeDe(f))}`, '_blank', 'noopener');
    if (f.sesion && !f.preguntar) actualizar(f.c.id, acciones.avisado(f.c, f.sesion));
    return true;
  };
  const copiarAviso = (f) => copiar(mensajeDe(f), f.c.id);

  const guardarPersona = (datos) => {
    const limpio = { ...datos, alias: datos.alias.trim(), frecuencia_dias: parseInt(datos.frecuencia_dias, 10) || 0 };
    if (datos.id) { setLista(lista.map((c) => (c.id === datos.id ? { ...c, ...limpio } : c))); return datos.id; }
    const id = nuevoId();
    setLista([...lista, { ...limpio, id }]);
    return id;
  };

  const borrarPersona = (id) => {
    setLista(lista.filter((x) => x.id !== id));
    setPagos(pagos.filter((p) => p.cliente_id !== id));
  };

  return {
    lista, pagos, ajustes, ahora, vista, precio, copiado,
    setLista, setPagos, setAjustes, persona, filaDe, pagoDe, actualizar, ciclarPago, avisar, copiarAviso, copiar, guardarPersona, borrarPersona,
  };
}
