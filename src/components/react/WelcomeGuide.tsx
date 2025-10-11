import React, { useState, useEffect } from 'react';

interface WelcomeGuideProps {
  onComplete?: () => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  const steps = [
    {
      title: '¡Bienvenido a Town! 🎉',
      content: '¡Hola! Te damos la bienvenida a Town, tu plataforma de compras locales.',
      townyImage: '/towny/towny_saludando.png'
    },
    {
      title: 'Aquí puedes conseguir todo lo que necesites 🛍️',
      content: 'En Town puedes encontrar productos de tu barrio, hacer pedidos y recibirlos en tu hogar. ¡Explora y disfruta!',
      townyImage: '/towny/towny_brazos_extendidos_feliz.png'
    }
  ];

  useEffect(() => {
    // Escuchar cambios de autenticación
    const handleAuthStateChange = () => {
      // Verificar si hay un usuario autenticado
      const authState = localStorage.getItem('auth-state');
      const isAuthenticated = authState === 'authenticated';
      
      if (isAuthenticated && !userAuthenticated) {
        setUserAuthenticated(true);
        
        // Verificar si es la primera vez que el usuario se loguea
        const isFirstLogin = localStorage.getItem('town_first_login');
        if (!isFirstLogin) {
          // Pequeño delay para que la página se estabilice
          setTimeout(() => {
            setIsVisible(true);
          }, 1000);
          localStorage.setItem('town_first_login', 'true');
        }
      } else if (!isAuthenticated && userAuthenticated) {
        setUserAuthenticated(false);
      }
    };

    // Verificar estado inicial
    handleAuthStateChange();

    // Escuchar eventos de cambio de autenticación
    window.addEventListener('auth-state-changed', handleAuthStateChange);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, [userAuthenticated]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="relative mx-4 max-w-md w-full">
        {/* Towny Character */}
        <div 
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-cover bg-center bg-no-repeat z-10"
          style={{ backgroundImage: `url('${currentStepData.townyImage}')` }}
        />
        
        {/* Message Box */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-2xl border border-slate-600">
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            {currentStepData.title}
          </h2>
          <p className="text-gray-200 text-center mb-6 leading-relaxed">
            {currentStepData.content}
          </p>
          
          {/* Buttons */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Omitir
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isLastStep ? '¡Entendido!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeGuide;
