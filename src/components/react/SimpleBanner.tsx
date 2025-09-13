import { useState } from "react";

interface SimpleBannerProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function SimpleBanner({
  title = "¡Bienvenido a nuestra tienda!",
  subtitle = "Los mejores productos al mejor precio",
  className = "",
}: SimpleBannerProps) {
  return (
    <section
      className={`py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white ${className}`}
    >
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">{title}</h1>
        <p className="text-xl md:text-2xl mb-8">{subtitle}</p>
        <button className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors">
          Ver Productos
        </button>
      </div>
    </section>
  );
}



