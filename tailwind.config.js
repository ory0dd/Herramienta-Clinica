/** @type {import('tailwindcss').Config} */

// Dirección visual: consultorio de noche. Grafito con un leve tono azul y un solo acento salvia,
// apagado y tranquilo. Los colores de estado (ámbar avisar, rosa debe, azul sin confirmar) solo informan.
// La escala "emerald" se redefine como salvia para que todo el dashboard use el mismo acento.
const salvia = {
  50: '#f4f7f2', 100: '#e6ede2', 200: '#d0dec9', 300: '#b8ceaf', 400: '#a1bd97',
  500: '#88a77f', 600: '#6e8b66', 700: '#576f51', 800: '#455842', 900: '#384736', 950: '#1d261c',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    // xs: pantallas de 340 px o más. bajo: pantallas bajitas, como la pantalla exterior del Galaxy Z Flip.
    screens: {
      xs: '340px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
      bajo: { raw: '(max-height: 520px)' },
    },
    extend: {
      colors: {
        emerald: salvia,
        base: '#0b0d11',     // fondo de la página
        surface: '#111419',  // tarjetas
        raised: '#171b22',   // elementos activos y campos
        line: '#242a34',     // bordes y divisiones
        ink: '#e9ebef',      // texto principal
      },
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
