import React, { useState, useEffect } from 'react';
import QuestionsSystem from './QuestionsSystem';

export default function QuestionsSystemWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuestions = () => {
      console.log('🎯 QuestionsSystemWrapper: Evento recibido, abriendo modal');
      setIsOpen(true);
    };

    console.log('👂 QuestionsSystemWrapper: Escuchando evento "open-questions-system"');
    // Escuchar el evento personalizado
    window.addEventListener('open-questions-system', handleOpenQuestions);

    return () => {
      console.log('🔇 QuestionsSystemWrapper: Removiendo listener');
      window.removeEventListener('open-questions-system', handleOpenQuestions);
    };
  }, []);

  console.log('🔄 QuestionsSystemWrapper renderizando, isOpen:', isOpen);

  return (
    <QuestionsSystem
      isOpen={isOpen}
      onClose={() => {
        console.log('❌ QuestionsSystemWrapper: Cerrando modal');
        setIsOpen(false);
      }}
    />
  );
}

