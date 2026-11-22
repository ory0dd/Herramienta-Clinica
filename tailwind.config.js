/** @type {import('tailwindcss').Config} */

// Dirección visual: consultorio de noche, con un solo acento salvia.
// Los colores salen de variables (src/tema.css) para cambiar de tema sin tocar los componentes.
const escala = (n) => Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, `rgb(var(--${n}-${s}) / <alpha-value>)`]));
const token = (n) => `rgb(var(--${n}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // xs: pantallas de 340 px o más. bajo: pantallas bajitas, como la pantalla exterior del Galaxy Z Flip.
    screens: {
      xs: '340px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
      bajo: { raw: '(max-height: 520px)' },
    },
    extend: {
      colors: {
        zinc: escala('zinc'),
        emerald: escala('emerald'), // salvia
        rose: escala('rose'),
        amber: escala('amber'),
        sky: escala('sky'),
        white: token('velo'),  // realces translúcidos (bg-white/[0.03]); un blanco fijo es bg-[#fff]
        base: token('base'),       // fondo de la página
        surface: token('surface'), // tarjetas
        raised: token('raised'),   // elementos activos y campos
        line: token('line'),       // bordes y divisiones
        ink: token('ink'),         // texto principal
      },
      boxShadow: { suave: 'var(--sombra)' },
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        entrada: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        aviso: { from: { opacity: '0', transform: 'translateY(10px) scale(.96)' }, to: { opacity: '1', transform: 'none' } },
        'entrar-derecha': { from: { opacity: '0', transform: 'translateX(28px)' }, to: { opacity: '1', transform: 'none' } },
        'entrar-izquierda': { from: { opacity: '0', transform: 'translateX(-28px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        entrada: 'entrada .35s ease-out both',
        fadeIn: 'fadeIn .2s ease-out both',
        aviso: 'aviso .28s cubic-bezier(.22,.8,.24,1) both',
        'entrar-derecha': 'entrar-derecha .3s cubic-bezier(.22,.8,.24,1) both',
        'entrar-izquierda': 'entrar-izquierda .3s cubic-bezier(.22,.8,.24,1) both',
      },
    },
  },
  plugins: [],
};
