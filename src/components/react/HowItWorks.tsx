import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      icon: '🤖',
      title: '1. Pregunta a la IA',
      description: 'Describe lo que necesitas y nuestra IA te ayuda a encontrar los mejores productos'
    },
    {
      icon: '🛒',
      title: '2. Compra rápido',
      description: 'Selecciona productos de vendedores locales y completa tu pedido en segundos'
    },
    {
      icon: '🚚',
      title: '3. Recibe en casa',
      description: 'Disfruta de entrega rápida y productos frescos de tu barrio'
    }
  ];

  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          ¿Cómo funciona Town?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
