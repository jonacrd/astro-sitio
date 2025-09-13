export default function SimpleSectionCarousel() {
  const sections = [
    {
      title: "Nuevas Colecciones",
      description: "Descubre las últimas tendencias de la temporada",
      icon: "✨",
    },
    {
      title: "Ofertas Especiales",
      description: "Hasta 50% de descuento en productos seleccionados",
      icon: "🔥",
    },
    {
      title: "Envío Gratis",
      description: "En compras superiores a $50.000",
      icon: "🚚",
    },
    {
      title: "Soporte 24/7",
      description: "Estamos aquí para ayudarte siempre",
      icon: "💬",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Descubre todas las ventajas que tenemos para ofrecerte
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-2xl p-6 text-center hover:bg-opacity-20 transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl mb-4">{section.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">
                {section.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



