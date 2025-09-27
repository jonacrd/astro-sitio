import React, { useState } from 'react';

interface SellerPost {
  id: string;
  seller: {
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  content: string;
  timeAgo: string;
  images?: string[];
  products?: {
    id: string;
    title: string;
    price: number;
    image: string;
  }[];
  likes: number;
  comments: number;
}

interface SellerPostsGridProps {
  posts?: SellerPost[];
  onAddToCart: (productId: string) => void;
  onContact: (sellerId: string) => void;
}

export default function SellerPostsGrid({ posts = [], onAddToCart, onContact }: SellerPostsGridProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Posts de ejemplo
  const mockPosts: SellerPost[] = [
    {
      id: '1',
      seller: {
        name: 'Natalia',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        isOnline: true
      },
      content: 'Disponibles cigarros y cigarros al momento',
      timeAgo: 'Ahora',
      images: ['https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?w=400&h=300&fit=crop'],
      likes: 12,
      comments: 3
    },
    {
      id: '2',
      seller: {
        name: 'Carlos',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        isOnline: false
      },
      content: 'Empanadas frescas recién hechas, pollo, carne y queso',
      timeAgo: '1h',
      images: ['https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop'],
      products: [
        {
          id: 'emp1',
          title: 'Empanadas de Pollo',
          price: 2500,
          image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=200&h=200&fit=crop'
        }
      ],
      likes: 8,
      comments: 2
    },
    {
      id: '3',
      seller: {
        name: 'María',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
        isOnline: true
      },
      content: 'Servicio de limpieza a domicilio, oficinas y casas',
      timeAgo: '2h',
      likes: 15,
      comments: 5
    },
    {
      id: '4',
      seller: {
        name: 'Luis',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        isOnline: true
      },
      content: 'Reparación de motos y bicicletas, servicio rápido',
      timeAgo: '3h',
      likes: 6,
      comments: 1
    }
  ];

  const displayPosts = posts.length > 0 ? posts : mockPosts;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (displayPosts.length === 0) {
    return (
      <section className="px-4 mb-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">Publicaciones de Vendedores</h3>
            <div className="text-center py-6">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-white/60 text-sm">No hay publicaciones recientes</p>
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
          <h3 className="text-lg font-bold text-white mb-3">Publicaciones de Vendedores</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayPosts.map((post) => (
              <div key={post.id} className="bg-muted/30 rounded-lg overflow-hidden hover:bg-muted/40 transition-all duration-300 hover:scale-[1.02] group">
                {/* Header del vendedor */}
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={post.seller.avatar}
                        alt={post.seller.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      {post.seller.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-primary rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <h4 className="text-white font-medium text-sm">{post.seller.name}</h4>
                        <span className="text-white/40 text-xs">•</span>
                        <span className="text-white/40 text-xs">{post.timeAgo}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onContact(post.seller.name)}
                      className="text-accent text-xs font-medium hover:text-accent/80 transition-colors"
                    >
                      Contactar
                    </button>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-3">
                  <p className="text-white/80 text-sm mb-3 leading-relaxed">
                    {post.content}
                  </p>

                  {/* Imágenes */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-3">
                      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                        {post.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="aspect-square">
                            <img
                              src={image}
                              alt={`Imagen ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Productos */}
                  {post.products && post.products.length > 0 && (
                    <div className="mb-3">
                      <div className="grid grid-cols-1 gap-2">
                        {post.products.map((product) => (
                          <div key={product.id} className="flex items-center gap-2 bg-muted/20 rounded-lg p-2">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h5 className="text-white font-medium text-xs">{product.title}</h5>
                              <p className="text-accent text-xs font-bold">{formatPrice(product.price)}</p>
                            </div>
                            <button
                              onClick={() => onAddToCart(product.id)}
                              className="bg-accent text-primary px-3 py-1 rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors"
                            >
                              Añadir
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer con interacciones */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          likedPosts.has(post.id) ? 'text-red-500' : 'text-white/60 hover:text-red-500'
                        }`}
                      >
                        <svg className="w-4 h-4" fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                      </button>
                      <button className="flex items-center gap-1 text-white/60 hover:text-white text-xs transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {post.comments}
                      </button>
                    </div>
                    <button className="text-white/60 hover:text-white text-xs transition-colors">
                      Compartir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
