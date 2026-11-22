# Herramienta Clínica: notas para Claude

Plantilla pública: cada terapeuta hace su copia y la conecta a su propio Supabase, Railway y Cloudflare.

## Cómo trabajar
- Responder en español de México, informal y directo. Textos de la app con "tú", tono cálido y profesional.
- Stack: React 18, Vite 6, Tailwind 3.4, lucide-react. El servidor es `server.js`: sirve `dist/` y hace de proxy a Cloudflare Workers AI.
- Verificar antes de subir: `npx vite build`. Probar en celular primero; también en el Galaxy Z Flip 5, incluida la pantalla chica de 260 px.
- Cada cambio se sube a `main` con un commit en español.
- Si se cambia la base de datos, va en `supabase/esquema.sql`. Debe poder correrse dos veces sin romper nada (`if not exists`, `drop policy if exists`). Avisar en la guía que hay que volver a correrlo.

## Cuidado con
- Nunca poner llaves, tokens ni datos de pacientes en el código, la guía o `.env.example`. En el frontend solo va la llave pública de Supabase.
- Privacidad clínica: desidentificar antes de mandar texto a la IA. El audio de las sesiones no se guarda.
- Sin ventanas emergentes: todo es por pantallas con transiciones (`src/app/rutas.jsx`).
