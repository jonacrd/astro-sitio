import React, { useState, useEffect } from 'react';
import QuestionsSystem from './QuestionsSystem';

export default function QuestionsSystemWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuestions = (event: any) => {
      console.log('🎯 QuestionsSystemWrapper: Evento recibido, abriendo modal', event);
      setIsOpen(true);
    };

    console.log('👂 QuestionsSystemWrapper: Escuchando evento "open-questions-system"');
    // Escuchar el evento personalizado
    window.addEventListener('open-questions-system', handleOpenQuestions);

    // También escuchar el evento show-login-modal para debug
    const handleShowLogin = (event: any) => {
      console.log('🔑 QuestionsSystemWrapper: Evento show-login-modal recibido', event);
    };
    window.addEventListener('show-login-modal', handleShowLogin);

    return () => {
      console.log('🔇 QuestionsSystemWrapper: Removiendo listeners');
      window.removeEventListener('open-questions-system', handleOpenQuestions);
      window.removeEventListener('show-login-modal', handleShowLogin);
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

