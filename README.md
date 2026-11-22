# aniima

Plantilla de consultorio en línea para psicólogas, psicólogos y terapeutas. Cada terapeuta tiene **su propia copia**, con su propia base de datos: nadie más ve a sus pacientes.

## Qué trae

- **Pantalla de entrada:** cada quien elige su lado, **Clínico** o **Consultante**.
- **Agenda:** sesiones de hoy, a quién toca avisar, calendario, pagos y personas. Incluye:
  - **Avisos por WhatsApp con un botón:** abre WhatsApp con el mensaje ya escrito.
  - **Google Calendar:** tus sesiones aparecen en un calendario aparte.
  - **"Dile qué pasó":** escribes lo que pasó y la agenda se actualiza sola.
- **Consultantes:** expedientes con ficha, notas de evolución (también desde audio), pruebas e informes imprimibles.
- **Entrevistas:** lo que tus consultantes llenan desde su celular, para convertirlo en expediente con un toque.
- **Cuadernos:** un cuaderno por caso, con chat y memoria. Subes el audio de cada sesión, se transcribe y se resume, y de ahí sale la nota de evolución.
- **Pruebas:** banco de pruebas psicométricas con calificación automática.
- **Lado del consultante:**
  - Crea su cuenta con su correo o con Google.
  - Confirma el consentimiento informado escribiendo su nombre o grabando su voz.
  - Llena su entrevista inicial por secciones.

## Empieza aquí (con Codex o Claude Code)

1. Crea una carpeta en tu computadora, por ejemplo `mi-consultorio`.
2. Abre **Codex** (o Claude Code) en esa carpeta.
3. Escríbele:

   > Clona https://github.com/ory0dd/Herramienta-Clinica en esta carpeta, lee AGENTS.md y ayúdame a configurar mi consultorio paso a paso.

4. El asistente te guía, un paso a la vez: tu copia privada en GitHub, tu base de datos en Supabase, tu página en Railway y, si quieres, el asistente de IA en Cloudflare.

Nunca le pegues en el chat tu llave secreta de Supabase ni tu token de Cloudflare: esos van directo en Railway.

## Cómo instalarla sin asistente

Sigue la [guía de instalación](GUIA-INSTALACION.md). Toma de 30 a 40 minutos y no necesitas saber programar. Vas a usar:

- **Supabase** para la base de datos y los accesos (tiene plan gratuito).
- **Railway** para publicar tu página.
- **Cloudflare Workers AI** para el asistente y la transcripción. Es opcional.

## Privacidad

- **Sin llaves en el código:** la plantilla no trae llaves ni datos reales. Las tuyas van solo en las variables de Railway.
- **Datos que salen al asistente:** antes de mandar texto al asistente se quitan nombres, teléfonos y correos. Aun así, escribe tus apuntes con códigos y sin datos que identifiquen a la persona.
- **Audio de las sesiones:** no se guarda, solo su transcripción.
- **Audio del consentimiento:** se guarda en un espacio privado. Solo lo escuchan el consultante y su terapeuta.
- **No es para urgencias:** esta herramienta no es un servicio de urgencias.

## Para probar en tu computadora

```bash
npm install
cp .env.example .env   # y pon tus datos
npm run build && npm start
```

Sin datos de Supabase funciona en modo de ejemplo, guardando solo en el navegador.
