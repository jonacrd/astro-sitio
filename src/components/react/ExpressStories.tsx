import React from 'react';

interface Story {
  id: string;
  title: string;
  image: string;
  seller: string;
  timeLeft: string;
  isViewed?: boolean;
}

interface ExpressStoriesProps {
  stories?: Story[];
  onStoryClick: (story: Story) => void;
}

export default function ExpressStories({ stories = [], onStoryClick }: ExpressStoriesProps) {
  // Datos de ejemplo con imágenes reales
  const mockStories: Story[] = [
    {
      id: '1',
      title: 'Empanadas',
      image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=200&h=200&fit=crop',
      seller: 'Doña María',
      timeLeft: '18h',
      isViewed: false
    },
    {
      id: '2',
      title: 'Cachapas',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
      seller: 'Carlos',
      timeLeft: '12h',
      isViewed: true
    },
    {
      id: '3',
      title: 'Perros Calientes',
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&h=200&fit=crop',
      seller: 'Ana',
      timeLeft: '6h',
      isViewed: false
    },
    {
      id: '4',
      title: 'Arepas',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop',
      seller: 'Luis',
      timeLeft: '3h',
      isViewed: true
    }
  ];

  const displayStories = stories.length > 0 ? stories : mockStories;

  return (
    <section className="px-4 mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">Ventas Express (24h)</h3>
          
          {displayStories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⏰</div>
              <p className="text-white/70">No hay ventas express activas</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto scroll-snap-x pb-2">
              {displayStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => onStoryClick(story)}
                  className="flex-shrink-0 w-20 text-center scroll-snap-start group"
                >
                  <div className="relative">
                    {/* Imagen circular */}
                    <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200 group-hover:scale-110 ${
                      story.isViewed 
                        ? 'border-white/30' 
                        : 'border-accent shadow-lg shadow-accent/25'
                    }`}>
                      <img
                        src={story.image}
                        alt={story.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                    {/* Indicador de no visto */}
                    {!story.isViewed && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Tiempo restante */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-accent text-xs px-1.5 py-0.5 rounded-full font-medium">
                      {story.timeLeft}
                    </div>
                  </div>
                  
                  {/* Título */}
                  <p className="text-white text-xs mt-2 truncate group-hover:text-accent transition-colors">
                    {story.title}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}










