import React, { useState } from 'react';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => void;
}

export default function QuestionModal({ isOpen, onClose, onSubmit }: QuestionModalProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      await onSubmit(question.trim());
      setQuestion('');
      onClose();
    } catch (error) {
      console.error('Error submitting question:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="card p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Haz una pregunta</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-white font-medium mb-2">
                ¿Qué quieres preguntar a la comunidad?
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ej: ¿Dónde puedo encontrar cachapas frescas cerca del centro?"
                className="w-full p-3 bg-surface/50 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                rows={4}
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="flex-1 px-4 py-2 bg-accent text-primary rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}









