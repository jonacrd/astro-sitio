import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface Question {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  is_urgent: boolean;
  is_resolved: boolean;
  created_at: string;
  user_id: string;
  user_name: string;
  answers_count: number;
}

interface QuestionAnswer {
  id: string;
  answer: string;
  contact_info?: string;
  is_verified: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_id: string;
  user_name: string;
  user_vote?: 'upvote' | 'downvote';
}

interface QuestionCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface QuestionsSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuestionsSystem({ isOpen, onClose }: QuestionsSystemProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    is_urgent: false
  });

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  // Cargar preguntas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          profiles!questions_user_id_fkey(name),
          question_answers(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedQuestions = data?.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        location: q.location,
        is_urgent: q.is_urgent,
        is_resolved: q.is_resolved,
        created_at: q.created_at,
        user_id: q.user_id,
        user_name: q.profiles?.name || 'Usuario',
        answers_count: q.question_answers?.[0]?.count || 0
      })) || [];

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error cargando preguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async (questionId: string) => {
    try {
      const { data, error } = await supabase
        .from('question_answers')
        .select(`
          *,
          profiles!question_answers_user_id_fkey(name),
          answer_votes!left(vote_type)
        `)
        .eq('question_id', questionId)
        .order('upvotes', { ascending: false });

      if (error) throw error;

      const formattedAnswers = data?.map(a => ({
        id: a.id,
        answer: a.answer,
        contact_info: a.contact_info,
        is_verified: a.is_verified,
        upvotes: a.upvotes,
        downvotes: a.downvotes,
        created_at: a.created_at,
        user_id: a.user_id,
        user_name: a.profiles?.name || 'Usuario',
        user_vote: a.answer_votes?.[0]?.vote_type
      })) || [];

      setAnswers(formattedAnswers);
    } catch (error) {
      console.error('Error cargando respuestas:', error);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || !newQuestion.category) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('questions')
        .insert({
          user_id: user.id,
          title: newQuestion.title.trim(),
          description: newQuestion.description.trim(),
          category: newQuestion.category,
          location: newQuestion.location.trim() || null,
          is_urgent: newQuestion.is_urgent
        });

      if (error) throw error;

      // Limpiar formulario y recargar preguntas
      setNewQuestion({
        title: '',
        description: '',
        category: '',
        location: '',
        is_urgent: false
      });
      setShowNewQuestion(false);
      loadQuestions();
    } catch (error) {
      console.error('Error creando pregunta:', error);
      alert('Error creando la pregunta. Intenta de nuevo.');
    }
  };

  const handleVote = async (answerId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Verificar si ya votó
      const { data: existingVote } = await supabase
        .from('answer_votes')
        .select('vote_type')
        .eq('answer_id', answerId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remover voto si es el mismo
          await supabase
            .from('answer_votes')
            .delete()
            .eq('answer_id', answerId)
            .eq('user_id', user.id);
        } else {
          // Cambiar voto
          await supabase
            .from('answer_votes')
            .update({ vote_type: voteType })
            .eq('answer_id', answerId)
            .eq('user_id', user.id);
        }
      } else {
        // Crear nuevo voto
        await supabase
          .from('answer_votes')
          .insert({
            answer_id: answerId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      // Recargar respuestas
      if (selectedQuestion) {
        loadAnswers(selectedQuestion.id);
      }
    } catch (error) {
      console.error('Error votando:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                🏘️ Preguntas del Vecindario
              </h2>
              <p className="text-green-100 text-sm">
                Pregunta y comparte recomendaciones de servicios locales
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Lista de preguntas */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => setShowNewQuestion(true)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>+</span>
                Hacer una Pregunta
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando preguntas...</p>
                </div>
              ) : (
                <div className="p-2">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      onClick={() => {
                        setSelectedQuestion(question);
                        loadAnswers(question.id);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                        selectedQuestion?.id === question.id
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {question.title}
                          </h3>
                          <p className="text-gray-500 text-xs mt-1">
                            {question.user_name} • {formatTimeAgo(question.created_at)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {categories.find(c => c.id === question.category)?.icon} {categories.find(c => c.id === question.category)?.name}
                            </span>
                            {question.is_urgent && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                🔥 Urgente
                              </span>
                            )}
                            {question.is_resolved && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✅ Resuelto
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {question.answers_count} respuestas
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalle de pregunta y respuestas */}
          <div className="w-1/2 flex flex-col">
            {selectedQuestion ? (
              <>
                {/* Pregunta seleccionada */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {selectedQuestion.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-3">
                    {selectedQuestion.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Por {selectedQuestion.user_name}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(selectedQuestion.created_at)}</span>
                    {selectedQuestion.location && (
                      <>
                        <span>•</span>
                        <span>📍 {selectedQuestion.location}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Respuestas */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Respuestas ({answers.length})
                  </h4>
                  {answers.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Aún no hay respuestas. ¡Sé el primero en ayudar!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {answers.map((answer) => (
                        <div key={answer.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-800 text-sm mb-2">
                            {answer.answer}
                          </p>
                          {answer.contact_info && (
                            <p className="text-blue-600 text-sm font-medium mb-2">
                              📞 {answer.contact_info}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Por {answer.user_name}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(answer.created_at)}</span>
                              {answer.is_verified && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600">✅ Verificado</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleVote(answer.id, 'upvote')}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  answer.user_vote === 'upvote'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                }`}
                              >
                                👍 {answer.upvotes}
                              </button>
                              <button
                                onClick={() => handleVote(answer.id, 'downvote')}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  answer.user_vote === 'downvote'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                }`}
                              >
                                👎 {answer.downvotes}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Selecciona una pregunta para ver las respuestas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para nueva pregunta */}
        {showNewQuestion && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Hacer una Pregunta</h3>
              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                    placeholder="Ej: ¿Conocen un buen plomero?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newQuestion.description}
                    onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}
                    placeholder="Describe tu problema o necesidad..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación (opcional)
                  </label>
                  <input
                    type="text"
                    value={newQuestion.location}
                    onChange={(e) => setNewQuestion({...newQuestion, location: e.target.value})}
                    placeholder="Ej: Barrio El Prado, Centro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={newQuestion.is_urgent}
                    onChange={(e) => setNewQuestion({...newQuestion, is_urgent: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="urgent" className="text-sm text-gray-700">
                    🔥 Marcar como urgente
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewQuestion(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Publicar Pregunta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
