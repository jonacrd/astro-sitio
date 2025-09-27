// =============================================
// HOME FEED V2 - FEED PRINCIPAL CON PAGINACIÓN INFINITA
// =============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createFeedComposer, createEmptyFeedSource, mergeFeedSources, type FeedItem, type FeedSource } from './FeedComposer';
import ProductCard from './ProductCard';
import ExpressCard from './ExpressCard';
import QuestionCard from './QuestionCard';

interface HomeFeedV2Props {
  onAddToCart: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  onContactExpress: (postId: string, contactMethod: string, contactValue: string) => void;
  onViewExpress: (postId: string) => void;
  onViewQuestion: (questionId: string) => void;
  onAnswerQuestion: (questionId: string) => void;
  className?: string;
}

export default function HomeFeedV2({
  onAddToCart,
  onViewProduct,
  onContactExpress,
  onViewExpress,
  onViewQuestion,
  onAnswerQuestion,
  className = ''
}: HomeFeedV2Props) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  const feedComposer = useRef(createFeedComposer());
  const feedSource = useRef<FeedSource>(createEmptyFeedSource());
  const isLoadingRef = useRef(false);

  // =============================================
  // FUNCIONES DE CARGA DE DATOS
  // =============================================

  const fetchProducts = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        status: 'active'
      });
      
      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          items: data.data.products || [],
          nextCursor: data.data.next_cursor,
          hasMore: data.data.has_more
        };
      }
      
      throw new Error(data.error?.message || 'Failed to fetch products');
    } catch (error) {
      console.warn('⚠️ Error fetching products, usando datos de ejemplo:', error);
      // Fallback con datos de ejemplo
      return { 
        items: [
          {
            id: 'example-1',
            title: 'Producto de Ejemplo',
            description: 'Descripción del producto',
            price: 10000,
            image_url: 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
            category: 'General',
            status: 'active'
          }
        ], 
        nextCursor: undefined, 
        hasMore: false 
      };
    }
  }, []);

  const fetchExpressPosts = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        status: 'active'
      });
      
      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`/api/social/express?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          items: data.data.posts || [],
          nextCursor: data.data.next_cursor,
          hasMore: data.data.has_more
        };
      }
      
      throw new Error(data.error?.message || 'Failed to fetch express posts');
    } catch (error) {
      console.warn('⚠️ Error fetching express posts, usando datos de ejemplo:', error);
      return { 
        items: [
          {
            id: 'express-1',
            title: 'Venta Express de Ejemplo',
            description: 'Producto en venta rápida',
            price: 5000,
            media: ['https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80'],
            contact_method: 'whatsapp',
            contact_value: '+56912345678',
            status: 'active'
          }
        ], 
        nextCursor: undefined, 
        hasMore: false 
      };
    }
  }, []);

  const fetchQuestions = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        status: 'open'
      });
      
      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`/api/social/questions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          items: data.data.questions || [],
          nextCursor: data.data.next_cursor,
          hasMore: data.data.has_more
        };
      }
      
      throw new Error(data.error?.message || 'Failed to fetch questions');
    } catch (error) {
      console.warn('⚠️ Error fetching questions, usando datos de ejemplo:', error);
      return { 
        items: [
          {
            id: 'question-1',
            user: { name: 'Usuario', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' },
            timeAgo: '2h',
            question: '¿Alguien sabe de un buen servicio?',
            repliesCount: 3
          }
        ], 
        nextCursor: undefined, 
        hasMore: false 
      };
    }
  }, []);

  // =============================================
  // FUNCIÓN DE CARGA DE FEED
  // =============================================

  const loadFeedData = useCallback(async (isInitial = false) => {
    if (isLoadingRef.current) return;
    
    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);

    try {
      // Cargar datos en paralelo
      const [productsData, expressData, questionsData] = await Promise.all([
        fetchProducts(isInitial ? undefined : feedSource.current.products.nextCursor),
        fetchExpressPosts(isInitial ? undefined : feedSource.current.express.nextCursor),
        fetchQuestions(isInitial ? undefined : feedSource.current.questions.nextCursor)
      ]);

      // Actualizar fuente de datos
      const newFeedSource = {
        products: {
          items: [...feedSource.current.products.items, ...productsData.items],
          nextCursor: productsData.nextCursor,
          hasMore: productsData.hasMore
        },
        express: {
          items: [...feedSource.current.express.items, ...expressData.items],
          nextCursor: expressData.nextCursor,
          hasMore: expressData.hasMore
        },
        questions: {
          items: [...feedSource.current.questions.items, ...questionsData.items],
          nextCursor: questionsData.nextCursor,
          hasMore: questionsData.hasMore
        }
      };

      feedSource.current = newFeedSource;

      // Componer feed
      const newFeedItems = feedComposer.current.composeFeed(newFeedSource);
      
      if (isInitial) {
        setFeedItems(newFeedItems);
      } else {
        setFeedItems(prev => [...prev, ...newFeedItems]);
      }

      // Verificar si hay más contenido
      const hasMoreContent = newFeedSource.products.hasMore || 
                            newFeedSource.express.hasMore || 
                            newFeedSource.questions.hasMore;
      
      setHasMore(hasMoreContent);

    } catch (error) {
      console.error('Error loading feed data:', error);
      setError('Error al cargar el feed. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchProducts, fetchExpressPosts, fetchQuestions]);

  // =============================================
  // INTERSECTION OBSERVER PARA PAGINACIÓN INFINITA
  // =============================================

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadFeedData(false);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadFeedData]);

  // =============================================
  // CARGA INICIAL
  // =============================================

  useEffect(() => {
    loadFeedData(true);
  }, [loadFeedData]);

  // =============================================
  // RENDERIZADO DE ITEMS
  // =============================================

  const renderFeedItem = (item: FeedItem, index: number) => {
    const key = `${item.type}-${item.id}-${index}`;

    switch (item.type) {
      case 'product':
        return (
          <ProductCard
            key={key}
            product={item.data}
            onAddToCart={onAddToCart}
            onViewProduct={onViewProduct}
            className="w-full"
          />
        );

      case 'express':
        return (
          <ExpressCard
            key={key}
            expressPost={item.data}
            onContact={onContactExpress}
            onViewPost={onViewExpress}
            className="w-full"
          />
        );

      case 'question':
        return (
          <QuestionCard
            key={key}
            question={item.data}
            onViewQuestion={onViewQuestion}
            onAnswerQuestion={onAnswerQuestion}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  // =============================================
  // RENDERIZADO PRINCIPAL
  // =============================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid de productos y express posts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {feedItems.map((item, index) => {
          // Productos y express posts van en grid 2 columnas
          if (item.type === 'product' || item.type === 'express') {
            return renderFeedItem(item, index);
          }
          return null;
        })}
      </div>

      {/* Preguntas van en full width */}
      <div className="space-y-4">
        {feedItems.map((item, index) => {
          if (item.type === 'question') {
            return renderFeedItem(item, index);
          }
          return null;
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => loadFeedData(true)}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Sentinel para paginación infinita */}
      {hasMore && (
        <div ref={sentinelRef} className="h-4" />
      )}

      {/* End of feed message */}
      {!hasMore && feedItems.length > 0 && (
        <div className="text-center py-8">
          <p className="text-white/60 text-sm">Has llegado al final del feed</p>
        </div>
      )}
    </div>
  );
}


