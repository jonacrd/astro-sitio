import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface Story {
  story_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video';
  background_color: string;
  text_color: string;
  font_size: number;
  text_position: 'top' | 'center' | 'bottom';
  views_count: number;
  created_at: string;
  expires_at: string;
  has_viewed: boolean;
}

interface StoryCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  initialStoryIndex?: number;
  stories: Story[];
  userId?: string;
}

export default function StoryCarousel({ 
  isOpen, 
  onClose, 
  initialStoryIndex = 0, 
  stories, 
  userId 
}: StoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  const progressRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 segundos por historia

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (isOpen && currentStory) {
      // Marcar como vista
      markAsViewed(currentStory);
      
      // Iniciar progreso
      startProgress();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, currentIndex, currentStory]);

  const startProgress = () => {
    setProgress(0);
    setIsPlaying(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (storyDuration / 100));
        if (newProgress >= 100) {
          nextStory();
          return 0;
        }
        return newProgress;
      });
    }, 100);
  };

  const pauseProgress = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeProgress = () => {
    setIsPlaying(true);
    startProgress();
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const markAsViewed = async (story: Story) => {
    try {
      if (userId && !story.has_viewed) {
        await supabase
          .from('story_views')
          .insert({
            story_id: story.story_id,
            viewer_id: userId
          });
      }
    } catch (error) {
      console.error('❌ Error marcando historia como vista:', error);
    }
  };

  const loadReplies = async (storyId: string) => {
    try {
      const { data, error } = await supabase
        .from('story_replies')
        .select(`
          id,
          content,
          media_url,
          media_type,
          created_at,
          author_id,
          profiles!story_replies_author_id_fkey(name, avatar_url)
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando respuestas:', error);
        return;
      }

      setReplies(prev => ({
        ...prev,
        [storyId]: data || []
      }));
    } catch (error) {
      console.error('❌ Error cargando respuestas:', error);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !userId || !currentStory) return;

    try {
      setSendingReply(true);

      const { error } = await supabase
        .from('story_replies')
        .insert({
          story_id: currentStory.story_id,
          author_id: userId,
          content: replyText.trim()
        });

      if (error) {
        console.error('❌ Error enviando respuesta:', error);
        return;
      }

      setReplyText('');
      loadReplies(currentStory.story_id);
    } catch (error) {
      console.error('❌ Error enviando respuesta:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirada';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto bg-black">
        {/* Header con progreso */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          {/* Barras de progreso */}
          <div className="flex gap-1 mb-4">
            {stories.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index < currentIndex ? 'bg-white' : 
                  index === currentIndex ? 'bg-white bg-opacity-50' : 
                  'bg-white bg-opacity-20'
                }`}
              >
                {index === currentIndex && (
                  <div
                    ref={progressRef}
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Info del autor */}
          <div className="flex items-center gap-3">
            <img
              src={currentStory.author_avatar}
              alt={currentStory.author_name}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <div>
              <p className="text-white font-medium text-sm">{currentStory.author_name}</p>
              <p className="text-white text-opacity-70 text-xs">
                {getTimeRemaining(currentStory.expires_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido de la historia */}
        <div 
          className="w-full h-full flex items-center justify-center relative"
          style={{ backgroundColor: currentStory.background_color }}
          onMouseDown={pauseProgress}
          onMouseUp={resumeProgress}
          onTouchStart={pauseProgress}
          onTouchEnd={resumeProgress}
        >
          {/* Media */}
          {currentStory.media_type === 'image' ? (
            <img
              src={currentStory.media_url}
              alt="Historia"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={currentStory.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
            />
          )}

          {/* Texto superpuesto */}
          {currentStory.content && (
            <div 
              className={`absolute left-4 right-4 ${
                currentStory.text_position === 'top' ? 'top-20' :
                currentStory.text_position === 'bottom' ? 'bottom-20' :
                'top-1/2 transform -translate-y-1/2'
              }`}
            >
              <p
                className="text-center font-medium"
                style={{
                  color: currentStory.text_color,
                  fontSize: `${currentStory.font_size}px`,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {currentStory.content}
              </p>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="absolute inset-0 flex">
          {/* Área izquierda - historia anterior */}
          <div 
            className="w-1/2 h-full cursor-pointer"
            onClick={prevStory}
          />
          
          {/* Área derecha - siguiente historia */}
          <div 
            className="w-1/2 h-full cursor-pointer"
            onClick={nextStory}
          />
        </div>

        {/* Botones de acción */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
          {/* Respuestas */}
          <button
            onClick={() => {
              setShowReplies(!showReplies);
              if (!showReplies) {
                loadReplies(currentStory.story_id);
              }
            }}
            className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2 text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Compartir */}
          <button className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>

          {/* Cerrar */}
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2 text-white ml-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Panel de respuestas */}
        {showReplies && (
          <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-medium text-gray-900">Respuestas</h4>
              <button
                onClick={() => setShowReplies(false)}
                className="ml-auto text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Lista de respuestas */}
            <div className="space-y-3 mb-4">
              {(replies[currentStory.story_id] || []).map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <img
                    src={reply.profiles?.avatar_url || '/default-avatar.png'}
                    alt={reply.profiles?.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {reply.profiles?.name}
                    </p>
                    <p className="text-sm text-gray-700">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario de respuesta */}
            {userId && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendReply();
                    }
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}







