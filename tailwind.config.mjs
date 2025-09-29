/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      colors: {
        // Design tokens del sistema UI
        bg: { 
          app: 'var(--bg-app)', 
          surface: 'var(--bg-surface)', 
          paper: 'var(--bg-paper)' 
        },
        ink: { 
          base: 'var(--text-primary)', 
          inverse: 'var(--text-inverse)', 
          muted: 'var(--muted)' 
        },
        brand: { 
          primary: 'var(--primary)', 
          primary600: 'var(--primary-600)', 
          accent: 'var(--accent)' 
        },
        state: { 
          success: 'var(--success)', 
          danger: 'var(--danger)', 
          warn: 'var(--warning)' 
        },
        stroke: { 
          soft: 'var(--border-soft)' 
        },
        // Mantener colores existentes para compatibilidad
        primary: "#0A0A0A",
        surface: "#1A1A1A",
        muted: "#2A2A2A",
        accent: "#F8C20A",
        success: "#16A34A",
        dark: "#111111",
      },
      backgroundImage: {
        // Gradiente brand de Town
        "brand-gradient": "linear-gradient(135deg, #0B1B3A 0%, #3B2F7A 50%, #6D28D9 100%)",
        "brand-gradient-horizontal": "linear-gradient(90deg, #0B1B3A 0%, #3B2F7A 50%, #6D28D9 100%)",
        "brand-gradient-vertical": "linear-gradient(180deg, #0B1B3A 0%, #3B2F7A 50%, #6D28D9 100%)",
      },
      boxShadow: {
        // Sombra de tarjeta de Town
        "card": "0 10px 30px rgba(0, 0, 0, 0.25)",
        "card-hover": "0 15px 40px rgba(0, 0, 0, 0.35)",
        "card-inset": "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
        // Sombras adicionales para profundidad
        "elevation-1": "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
        "elevation-2": "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        "elevation-3": "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)",
      },
      borderRadius: {
        // Design tokens
        xl: 'var(--radius)',
        // Mantener radios existentes
        "2xl": "1rem",
        "3xl": "1.5rem", 
        "4xl": "2rem",
      },
      boxShadow: {
        // Design tokens
        elev: 'var(--shadow-elev)',
        // Mantener sombras existentes
        "card": "0 10px 30px rgba(0, 0, 0, 0.25)",
        "card-hover": "0 15px 40px rgba(0, 0, 0, 0.35)",
        "card-inset": "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
        "elevation-1": "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
        "elevation-2": "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        "elevation-3": "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-subtle": "bounceSubtle 0.6s ease-in-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(248, 194, 10, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(248, 194, 10, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};





