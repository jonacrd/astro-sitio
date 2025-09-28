import React, { useState, useEffect } from 'react';
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

interface StoryRingProps {
  userId?: string;
  onStoryClick?: (story: Story) => void;
  className?: string;
}

export default function StoryRing({ userId, onStoryClick, className = '' }: StoryRingProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
  }, [userId]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📖 Cargando historias...');

      // Obtener historias activas
      const { data, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          author_id,
          content,
          media_url,
          media_type,
          background_color,
          text_color,
          font_size,
          text_position,
          views_count,
          created_at,
          expires_at
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (storiesError) {
        console.error('❌ Error cargando historias:', storiesError);
        throw storiesError;
      }

      // Verificar qué historias ha visto el usuario
      let viewedStories: string[] = [];
      if (userId) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', userId);

        viewedStories = views?.map(v => v.story_id) || [];
      }

      // Formatear datos
      const formattedStories = data?.map(story => ({
        story_id: story.id,
        author_id: story.author_id,
        author_name: 'Usuario', // Simplificado por ahora
        author_avatar: '/default-avatar.png', // Avatar por defecto
        content: story.content || '',
        media_url: story.media_url,
        media_type: story.media_type,
        background_color: story.background_color,
        text_color: story.text_color,
        font_size: story.font_size,
        text_position: story.text_position,
        views_count: story.views_count,
        created_at: story.created_at,
        expires_at: story.expires_at,
        has_viewed: viewedStories.includes(story.id)
      })) || [];

      console.log(`✅ Historias cargadas: ${formattedStories.length}`);

      setStories(formattedStories);
    } catch (err) {
      console.error('❌ Error cargando historias:', err);
      setError('Error cargando historias');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = async (story: Story) => {
    try {
      // Marcar como vista si el usuario está autenticado
      if (userId && !story.has_viewed) {
        await supabase
          .from('story_views')
          .insert({
            story_id: story.story_id,
            viewer_id: userId
          });

        // Actualizar estado local
        setStories(prev => prev.map(s => 
          s.story_id === story.story_id 
            ? { ...s, has_viewed: true, views_count: s.views_count + 1 }
            : s
        ));
      }

      // Llamar callback
      onStoryClick?.(story);
    } catch (error) {
      console.error('❌ Error marcando historia como vista:', error);
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

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando historias...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-4 text-red-500 ${className}`}>
        <p>Error: {error}</p>
        <button 
          onClick={loadStories}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className={`text-center p-4 text-gray-500 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <p className="text-sm">No hay historias disponibles</p>
        <p className="text-xs text-gray-400 mt-1">Las historias aparecen aquí cuando los usuarios las crean</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Historias</h3>
        <span className="text-sm text-gray-500">({stories.length})</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((story) => (
          <div
            key={story.story_id}
            className="flex-shrink-0 cursor-pointer group"
            onClick={() => handleStoryClick(story)}
          >
            <div className="relative">
              {/* Ring de la historia */}
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                story.has_viewed 
                  ? 'bg-gray-300' 
                  : 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500'
              }`}>
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                    {story.author_avatar ? (
                      <img
                        src={story.author_avatar}
                        alt={story.author_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-medium">
                          {story.author_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Indicador de tiempo restante */}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>

              {/* Nombre del autor */}
              <div className="text-center mt-2">
                <p className="text-xs font-medium text-gray-900 truncate max-w-16">
                  {story.author_name}
                </p>
                <p className="text-xs text-gray-500">
                  {getTimeRemaining(story.expires_at)}
                </p>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicador de scroll */}
      {stories.length > 5 && (
        <div className="flex justify-center mt-2">
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
