import { useState } from "react";

interface Section {
  title: string;
  description: string;
  imageUrl?: string;
  href?: string;
  icon?: string;
}

interface SectionCarouselProps {
  sections?: Section[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function SectionCarousel({
  sections = [],
  title = "¿Por qué elegirnos?",
  subtitle = "Descubre todas las ventajas que tenemos para ofrecerte",
  className = "",
}: SectionCarouselProps) {
  // Secciones por defecto si no se proporcionan
  const defaultSections: Section[] = [
    {
      title: "Nuevas Colecciones",
      description: "Descubre las últimas tendencias de la temporada",
      icon: "✨",
      href: "/catalogo?filter=nuevo",
    },
    {
      title: "Ofertas Especiales",
      description: "Hasta 50% de descuento en productos seleccionados",
      icon: "🔥",
      href: "/catalogo?filter=oferta",
    },
    {
      title: "Envío Gratis",
      description: "En compras superiores a $50.000",
      icon: "🚚",
      href: "/catalogo",
    },
    {
      title: "Soporte 24/7",
      description: "Estamos aquí para ayudarte siempre",
      icon: "💬",
      href: "/contacto",
    },
  ];

  const displaySections = sections.length > 0 ? sections : defaultSections;

  return (
    <section
      className={`py-16 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 relative overflow-hidden ${className}`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displaySections.map((section, index) => (
            <div
              key={index}
              className="group bg-slate-900/80 border border-slate-600/20 rounded-2xl p-8 text-center transition-all duration-300 backdrop-blur-sm relative overflow-hidden hover:-translate-y-2 hover:scale-105 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon */}
              {section.icon && (
                <span className="text-5xl mb-5 block drop-shadow-lg relative z-10">
                  {section.icon}
                </span>
              )}

              {/* Title */}
              <h3 className="text-xl font-semibold text-slate-100 mb-4 relative z-10">
                {section.title}
              </h3>

              {/* Description */}
              <p className="text-slate-300 leading-relaxed mb-6 relative z-10">
                {section.description}
              </p>

              {/* Link */}
              {section.href && (
                <a
                  href={section.href}
                  className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white no-underline px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative z-10 shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1 hover:from-blue-600 hover:to-purple-700"
                >
                  Ver más
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




