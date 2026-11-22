/**
 * portal.js
 * Lectura de lo que llenan los consultantes en su portal: cuenta, consentimiento y entrevista.
 * Solo funciona con Supabase conectado y sesión de terapeuta.
 */
import { nube, mensajeError } from './nube';
import { SECCIONES_ENTREVISTA, indicaRiesgo } from '../data/entrevista';

export async function cargarPortal() {
  const [c, e, k, a] = await Promise.all([
    nube.from('consultantes').select('id, usuario, alias, creado').order('creado', { ascending: false }),
    nube.from('entrevistas').select('consultante, respuestas, completada, actualizada'),
    nube.from('consentimientos').select('consultante, version, nombre_firma, aceptado_en, metodo, audio'),
    nube.from('ajustes_privados').select('valor').eq('clave', 'codigo_invitacion').maybeSingle(),
  ]);
  const falla = c.error || e.error || k.error || a.error;
  if (falla) throw new Error(mensajeError(falla));
  const entrevistas = new Map(e.data.map((x) => [x.consultante, x]));
  const consentimientos = new Map(k.data.map((x) => [x.consultante, x]));
  return {
    lista: c.data.map((x) => {
      const entrevista = entrevistas.get(x.id) || null;
      return { ...x, entrevista, consentimiento: consentimientos.get(x.id) || null, riesgo: indicaRiesgo(entrevista?.respuestas) };
    }),
    codigo: a.data?.valor || '',
  };
}

export async function guardarCodigo(valor) {
  const { error } = await nube.from('ajustes_privados').upsert({ clave: 'codigo_invitacion', valor }, { onConflict: 'clave' });
  if (error) throw new Error(mensajeError(error));
}

export const contestadas = (respuestas = {}) =>
  SECCIONES_ENTREVISTA.flatMap((s) => s.preguntas).filter((p) => String(respuestas[p.id] ?? '').trim()).length;

/** La entrevista en texto, por secciones (sin el nombre con el que se presentó). */
export function entrevistaComoTexto(respuestas = {}) {
  return SECCIONES_ENTREVISTA.map((s) => {
    const lineas = s.preguntas
      .filter((p) => p.id !== 'nombre_preferido' && String(respuestas[p.id] ?? '').trim())
      .map((p) => `- ${p.titulo} ${p.tipo === 'escala' ? `${respuestas[p.id]}/10` : respuestas[p.id]}`);
    return lineas.length ? `${s.titulo}:\n${lineas.join('\n')}` : '';
  }).filter(Boolean).join('\n\n');
}

/** Link temporal (1 hora) para escuchar el audio con el que alguien confirmó su consentimiento. */
export async function urlAudioConsentimiento(ruta) {
  if (!nube || !ruta) return null;
  const { data } = await nube.storage.from('consentimientos').createSignedUrl(ruta, 3600);
  return data?.signedUrl || null;
}
