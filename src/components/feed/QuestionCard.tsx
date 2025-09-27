// =============================================
// QUESTION CARD - TARJETA DE PREGUNTA
// =============================================

import React, { useState, useRef, useEffect } from 'react';

interface QuestionCardProps {
  question: {
    id: string;
    body: string;
    tags: string[];
    created_at: string;
    status: 'open' | 'closed' | 'removed';
    author?: {
      name: string;
      avatar?: string;
    };
    answers_count?: number;
    answers?: Array<{
      id: string;
      body: string;
      author: {
        name: string;
        avatar?: string;
      };
      upvotes: number;
      created_at: string;
    }>;
  };
  onViewQuestion: (questionId: string) => void;
  onAnswerQuestion: (questionId: string) => void;
  className?: string;
}

export default function QuestionCard({ 
  question, 
  onViewQuestion, 
  onAnswerQuestion, 
  className = '' 
}: QuestionCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para animaciones
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const date = new Date(dateString).getTime();
    const diff = now - date;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${days}d`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'removed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Abierta';
      case 'closed': return 'Cerrada';
      case 'removed': return 'Removida';
      default: return 'Desconocido';
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`bg-surface/30 rounded-lg overflow-hidden shadow-lg group cursor-pointer transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${className} ${
        isVisible ? 'animate-fade-in-scale' : 'opacity-0 scale-95'
      }`}
      onClick={() => onViewQuestion(question.id)}
    >
      {/* Header de la pregunta */}
      <div className="p-4 border-b border-white/10">
        {/* Información del autor y estado */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {question.author && (
              <>
                <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                  {question.author.avatar ? (
                    <img 
                      src={question.author.avatar} 
                      alt={question.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-white/70">👤</span>
                  )}
                </div>
                <div>
                  <span className="text-white font-medium text-sm">{question.author.name}</span>
                  <span className="text-white/60 text-xs ml-2">{formatTimeAgo(question.created_at)}</span>
                </div>
              </>
            )}
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(question.status)}`}>
            {getStatusLabel(question.status)}
          </div>
        </div>

        {/* Contenido de la pregunta */}
        <div className="mb-4">
          <p className="text-white text-base leading-relaxed">
            {question.body}
          </p>
        </div>

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags.map((tag, index) => (
              <span 
                key={index}
                className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1">
              <span>💬</span>
              <span>{question.answers_count || 0} respuestas</span>
            </span>
            <span className="flex items-center gap-1">
              <span>👀</span>
              <span>Ver respuestas</span>
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnswerQuestion(question.id);
            }}
            className="bg-accent text-primary px-4 py-2 rounded-lg font-medium hover:bg-accent/80 transition-colors"
          >
            Responder
          </button>
        </div>
      </div>

      {/* Respuestas destacadas (si las hay) */}
      {question.answers && question.answers.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium text-sm">Respuestas destacadas</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAnswers(!showAnswers);
              }}
              className="text-accent text-xs font-medium hover:text-accent/80 transition-colors"
            >
              {showAnswers ? 'Ocultar' : 'Ver todas'}
            </button>
          </div>
          
          {showAnswers && (
            <div className="space-y-3">
              {question.answers.slice(0, 2).map((answer) => (
                <div key={answer.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-muted/30 rounded-full flex items-center justify-center">
                      {answer.author.avatar ? (
                        <img 
                          src={answer.author.avatar} 
                          alt={answer.author.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-white/70">👤</span>
                      )}
                    </div>
                    <span className="text-white/70 text-xs">{answer.author.name}</span>
                    <span className="text-white/60 text-xs">{formatTimeAgo(answer.created_at)}</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {answer.body}
                  </p>
                  {answer.upvotes > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-yellow-400 text-xs">👍</span>
                      <span className="text-white/60 text-xs">{answer.upvotes} votos</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}




