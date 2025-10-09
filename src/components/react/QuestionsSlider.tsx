import React, { useState, useRef, useEffect } from 'react';

interface Question {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  question: string;
  timeAgo: string;
  answers: number;
  featuredAnswer?: {
    text: string;
    author: string;
  };
}

interface QuestionsSliderProps {
  questions?: Question[];
}

export default function QuestionsSlider({ questions = [] }: QuestionsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Datos de ejemplo
  const mockQuestions: Question[] = [
    {
      id: '1',
      user: {
        name: 'Juan',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      },
      question: '¿Dónde consigo adaptación de gas?',
      timeAgo: '2h',
      answers: 1,
      featuredAnswer: {
        text: 'Hola Juan! Vecino Fix hace adaptaciones',
        author: 'Maria'
      }
    },
    {
      id: '2',
      user: {
        name: 'Ana',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
      },
      question: '¿Alguien sabe de un buen mecánico que arregle motos?',
      timeAgo: '4h',
      answers: 3,
      featuredAnswer: {
        text: 'Sí, en el taller de la esquina, muy bueno y económico',
        author: 'Luis Mecánico'
      }
    }
  ];

  const displayQuestions = questions.length > 0 ? questions : mockQuestions;

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying || displayQuestions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayQuestions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayQuestions.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Reanudar auto-play después de 10s
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayQuestions.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayQuestions.length) % displayQuestions.length);
  };

  if (displayQuestions.length === 0) {
    return (
      <section className="px-4 mb-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">Preguntas</h3>
            <div className="text-center py-6">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-white/60 text-sm">Aún no hay preguntas</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface/30 rounded-xl p-4">
          <h3 className="text-lg font-bold text-white mb-3">Preguntas</h3>
          
          <div 
            ref={sliderRef}
            className="relative overflow-hidden"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Slider Container */}
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {displayQuestions.map((question) => (
                <div key={question.id} className="w-full flex-shrink-0">
                  <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/40 transition-colors">
                    {/* Header de la pregunta */}
                    <div className="flex items-start gap-2 mb-2">
                      <img
                        src={question.user.avatar}
                        alt={question.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <h4 className="text-white font-medium text-sm">{question.user.name}</h4>
                          <span className="text-white/40 text-xs">•</span>
                          <span className="text-white/40 text-xs">{question.timeAgo}</span>
                        </div>
                        <p className="text-white/80 text-xs leading-relaxed">
                          {question.question}
                        </p>
                      </div>
                    </div>

                    {/* Respuesta destacada */}
                    {question.featuredAnswer && (
                      <div className="bg-accent/10 border border-accent/20 rounded-md p-2 mb-2">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-2 h-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white text-xs font-medium mb-1">
                              {question.featuredAnswer.author}
                            </p>
                            <p className="text-white/70 text-xs">
                              {question.featuredAnswer.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">
                        {question.answers} respuesta{question.answers !== 1 ? 's' : ''}
                      </span>
                      <button className="text-accent text-xs font-medium hover:text-accent/80 transition-colors">
                        Ver respuestas
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {displayQuestions.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  ‹
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  ›
                </button>
              </>
            )}

            {/* Dots Indicators */}
            {displayQuestions.length > 1 && (
              <div className="flex justify-center gap-1 mt-3">
                {displayQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-accent' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}











