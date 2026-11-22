# Instrucciones para el asistente (Codex, Claude Code u otro)

Este repositorio es la **Herramienta Clínica**, una plantilla de consultorio en línea para terapeutas. Quien te abrió aquí casi siempre es una **terapeuta o un terapeuta que quiere instalar su propia copia** y no sabe programar. Tu trabajo es **guiarle paso a paso** hasta que tenga su consultorio funcionando con su propia base de datos.

La guía completa, con cada botón, está en `GUIA-INSTALACION.md`. Úsala como fuente; aquí está cómo acompañar.

## Cómo hablarle

- Español de México, con "tú", cálido y claro. Nada de jerga: si dices "variable", explica que es "un dato que se pega en Railway".
- **Un paso a la vez.** Di qué hacer, en qué página y qué botón, y espera a que confirme ("listo") antes de seguir.
- Si te manda una captura de pantalla, úsala para ubicar dónde está y qué le falta.
- Al empezar, pregúntale en qué paso va (puede que ya tenga algo hecho) y si quiere el asistente de IA (Cloudflare) o no.

## Reglas de seguridad (no negociables)

- **Nunca pidas que pegue en el chat** la llave secreta de Supabase ("service_role" o "secret"), el token de Cloudflare ni contraseñas. Esos datos se pegan directo en Railway o en su archivo `.env`, que escribe la persona.
- La única llave de Supabase que va en la app es la **pública** ("anon public" o "publishable"). Si te pasa una que diga "service_role" o "secret", dile que no la use y que la regenere en Supabase.
- `.env` nunca se sube a GitHub (ya está en `.gitignore`). Revísalo antes de cualquier `git push`.
- No metas datos reales de pacientes en el repositorio, en ejemplos ni en pruebas.
- Su repositorio en GitHub debe ser **privado**.

## El recorrido

### 0. Su computadora
- Revisa que tenga Node 20 o más reciente (`node -v`) y git (`git --version`). Si falta Node, que lo baje de nodejs.org (versión LTS).
- Si todavía no está el código en su carpeta: `git clone https://github.com/ory0dd/Herramienta-Clinica.git .` dentro de la carpeta que creó.

### 1. Su propio repositorio en GitHub
Railway publica desde GitHub, así que necesita **su** copia:
1. Que cree en github.com un repositorio **privado y vacío** (sin README), por ejemplo `mi-consultorio`.
2. Tú conectas la carpeta a ese repositorio y subes el código:
   ```bash
   git remote rename origin plantilla        # la plantilla original, para traer mejoras después
   git remote add origin https://github.com/SU-USUARIO/mi-consultorio.git
   git push -u origin main
   ```
   Si pide iniciar sesión en GitHub, acompáñale (GitHub Desktop o `gh auth login` lo resuelven).

### 2. Supabase (base de datos y accesos)
Sigue los pasos 2 a 5 de `GUIA-INSTALACION.md`:
1. Crear un proyecto en supabase.com (región cercana, contraseña guardada en un lugar seguro).
2. **SQL Editor → New query**: pegar **todo** el contenido de `supabase/esquema.sql` y dar **Run**. Puedes mostrarle el archivo o copiarlo al portapapeles si tu entorno lo permite.
3. **Authentication → Sign In / Providers → Email**: apagar **Confirm email**.
4. Copiar **Project URL** y la **llave pública**.
5. **Su acceso al lado clínico** (paso 8 de la guía):
   - En **Authentication → Users → Add user → Create new user**, crear su usuario con correo, contraseña y **Auto Confirm User** marcado.
   - En el SQL Editor, correr esta línea con **su** correo (arma tú la línea y dásela lista para pegar):
     ```sql
     insert into public.terapeutas (user_id, email) select id, email from auth.users where lower(email) = lower('SU-CORREO') on conflict do nothing;
     ```

### 3. Probarlo en su computadora
1. Copia `.env.example` como `.env`. Ayúdale a pegar ahí `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; los dos son públicos y puedes escribirlos tú si te los da.
2. Corre `npm install`, `npm run build` y `npm start`, y que abra http://localhost:3000.
3. Que elija **Clínico** y entre con el correo y la contraseña del paso 2.5. Si dice que la cuenta no es la dueña, falta la línea SQL del paso 2.5.

### 4. Publicarlo en Railway
Pasos 6 de la guía: **New Project → Deploy from GitHub repo**, elegir **su** repositorio, agregar en **Variables** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, **Deploy** y luego **Settings → Networking → Generate Domain**. Ese link es su consultorio.

### 5. Asistente de IA con Cloudflare (opcional)
Paso 7 de la guía: Account ID y token con la plantilla **Workers AI**. Esos dos datos los pega la persona directo en **Variables** de Railway (`CF_ACCOUNT_ID`, `CF_API_TOKEN`) y da **Deploy**. Si quiere probarlo en su computadora, que los escriba ella en su `.env`.
Para comprobar: en **Cuadernos**, junto al nombre de un caso debe salir el punto verde.

### 6. Invitar consultantes
Paso 9 de la guía: en **Entrevistas** guardar un código de invitación y compartir el link. Que haga una prueba desde otro navegador o su celular, eligiendo **Consultante**.

### 7. Google para consultantes (opcional)
La sección opcional de Google en la guía, más la variable `VITE_ACCESO_GOOGLE=si` en Railway.

### 8. Personalizar
Cuando todo funcione, pregúntale cómo se llama su consultorio y ponlo con la variable `VITE_NOMBRE_CONSULTORIO` en Railway (y en su `.env`). Después ofrece ajustar el consentimiento informado, la política de citas, la entrevista y los informes (tabla "Personaliza tu plantilla" en la guía). Recuérdale que el consentimiento es una plantilla y conviene revisarlo con su encuadre.
Después de cada cambio: `npm run build` para comprobar, commit en español y `git push`. Railway publica solo.

## Traer mejoras de la plantilla

Cuando la plantilla original tenga novedades:
```bash
git pull plantilla main
git push
```
Si cambió `supabase/esquema.sql`, hay que volver a correrlo completo en Supabase; se puede correr varias veces sin borrar nada.

## Si algo falla
Revisa la tabla "Problemas frecuentes" de `GUIA-INSTALACION.md` antes de cambiar código.

---

## Si estás modificando la plantilla en sí (mantenimiento)

- Stack: React 18, Vite 6, Tailwind 3.4, lucide-react. `server.js` sirve `dist/` y hace de proxy a Cloudflare Workers AI.
- Verifica con `npx vite build` antes de subir. Diseña para celular primero, incluido el Galaxy Z Flip 5 (pantalla chica de 260 px).
- Cambios de base de datos en `supabase/esquema.sql`, que debe poder correrse dos veces (`if not exists`, `drop policy if exists`). Avisa en la guía que hay que volver a correrlo.
- Sin ventanas emergentes: todo es por pantallas con transiciones (`src/app/rutas.jsx`).
- Commits en español. Nunca llaves ni datos de pacientes en el código, la guía o `.env.example`.
