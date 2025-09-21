import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      icon: '🤖',
      title: 'Pregunta a la IA',
      description: 'Describe lo que necesitas en lenguaje natural'
    },
    {
      icon: '🛒',
      title: 'Compra rápido',
      description: 'Selecciona y completa tu pedido en segundos'
    },
    {
      icon: '🚚',
      title: 'Recibe en casa',
      description: 'Entrega rápida de vendedores locales'
    }
  ];

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          ¿Cómo funciona Town?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
