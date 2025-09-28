import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { useAuth } from '../../hooks/useAuth';
import StoryRing from './StoryRing';
import StoryCarousel from './StoryCarousel';
import StoryUpload from './StoryUpload';
import CreateStoryButton from './CreateStoryButton';
import ProductFeed from './ProductFeed';

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

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  title: string;
  description: string;
  price_cents: number;
  category: string;
  contact_method: string;
  contact_value: string;
  status: string;
  created_at: string;
  expires_at: string;
  media_count: number;
  likes_count: number;
  has_liked: boolean;
  has_saved: boolean;
}

interface MixedFeedProps {
  userId?: string;
  className?: string;
}

export default function MixedFeed({ userId, className = '' }: MixedFeedProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStoryCarousel, setShowStoryCarousel] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  
  // Usar el hook de autenticación
  const { user: currentUser, isSeller, loading: authLoading } = useAuth();

  // Determinar rol del usuario
  const userRole = currentUser ? (isSeller ? 'seller' : 'buyer') : null;

  // Simplificar completamente - no cargar nada que pueda fallar
  console.log('📱 MixedFeed renderizado - ProductFeed siempre visible');

  // Funciones simplificadas - no hacer nada que pueda fallar
  const loadStories = async (): Promise<Story[]> => {
    console.log('📖 Historias deshabilitadas temporalmente');
    return [];
  };

  const loadPosts = async (): Promise<Post[]> => {
    console.log('📝 Posts deshabilitados temporalmente');
    return [];
  };

  const handleStoryClick = (story: Story) => {
    const storyIndex = stories.findIndex(s => s.story_id === story.story_id);
    setSelectedStoryIndex(storyIndex);
    setShowStoryCarousel(true);
  };

  const handleCreateStory = () => {
    console.log('🎬 handleCreateStory ejecutado', { 
      currentUser: currentUser?.email, 
      userRole, 
      isSeller,
      showStoryUpload 
    });
    
    if (!currentUser) {
      console.log('⚠️ Usuario no autenticado, mostrando modal de login');
      // Disparar evento global para mostrar modal
      window.dispatchEvent(new CustomEvent('show-login-modal', { 
        detail: { mode: 'login' } 
      }));
      return;
    }

    if (!isSeller) {
      console.log('⚠️ Usuario no es vendedor, solo vendedores pueden crear historias');
      alert('Solo los vendedores pueden crear historias. Actualiza tu perfil a vendedor para acceder a esta función.');
      return;
    }
    
    console.log('✅ Abriendo modal de subida de historia');
    setShowStoryUpload(true);
  };

  const handleStoryCreated = () => {
    console.log('✅ Historia creada - recargando página');
    window.location.reload();
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(cents);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  // Eliminar estados de carga y error - siempre mostrar ProductFeed

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sección de Productos Reales - Siempre visible */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <ProductFeed />
      </div>

      {/* Sección de Historias - Solo si hay historias */}
      {stories.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Historias</h2>
              <p className="text-sm text-gray-500">Historias de vendedores</p>
            </div>
            {currentUser && userRole === 'seller' && (
              <CreateStoryButton onClick={handleCreateStory} />
            )}
          </div>
          
          <StoryRing
            stories={stories}
            userId={currentUser?.id}
            onStoryClick={handleStoryClick}
          />
        </div>
      )}

      {/* Modales */}
      <StoryCarousel
        isOpen={showStoryCarousel}
        onClose={() => setShowStoryCarousel(false)}
        stories={stories}
        initialStoryIndex={selectedStoryIndex}
        userId={userId}
      />

      <StoryUpload
        isOpen={showStoryUpload}
        onClose={() => {
          console.log('🚪 Cerrando modal de subida de historia');
          setShowStoryUpload(false);
        }}
        onSuccess={handleStoryCreated}
        userId={currentUser?.id}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Auth: {currentUser ? '✅' : '❌'}</div>
          <div>Role: {userRole || 'none'}</div>
          <div>Seller: {isSeller ? '✅' : '❌'}</div>
          <div>Modal: {showStoryUpload.toString()}</div>
          <div>Loading: {authLoading ? '⏳' : '✅'}</div>
        </div>
      )}
    </div>
  );
}
