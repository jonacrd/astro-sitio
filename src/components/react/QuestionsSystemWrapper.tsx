import React, { useState, useEffect } from 'react';
import QuestionsSystem from './QuestionsSystem';

export default function QuestionsSystemWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuestions = () => {
      setIsOpen(true);
    };

    // Escuchar el evento personalizado
    window.addEventListener('open-questions-system', handleOpenQuestions);

    return () => {
      window.removeEventListener('open-questions-system', handleOpenQuestions);
    };
  }, []);

  return (
    <QuestionsSystem
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
}
