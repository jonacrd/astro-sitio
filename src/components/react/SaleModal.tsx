import React, { useState } from 'react';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sale: { title: string; description: string; price: number; images: string[] }) => void;
}

export default function SaleModal({ isOpen, onClose, onSubmit }: SaleModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price: parseInt(price),
        images
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setImages([]);
      onClose();
    } catch (error) {
      console.error('Error submitting sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    // Simular agregar imagen (en producción sería upload real)
    const newImage = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=500&fit=crop`;
    setImages([...images, newImage]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
        <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Publica una Venta Express</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-white font-medium mb-2">
                Título del producto
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Cachapas frescas"
                className="w-full p-3 bg-surface/50 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-white font-medium mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu producto..."
                className="w-full p-3 bg-surface/50 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                rows={3}
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-white font-medium mb-2">
                Precio (CLP)
              </label>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3500"
                className="w-full p-3 bg-surface/50 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Imágenes
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <button
                    type="button"
                    onClick={addImage}
                    className="w-full h-20 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center text-white/50 hover:border-accent hover:text-accent transition-colors"
                  >
                    + Agregar
                  </button>
                )}
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
              <p className="text-white text-sm">
                ⏰ Tu venta expirará en 24 horas
              </p>
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
                disabled={loading || !title.trim() || !description.trim() || !price.trim()}
                className="flex-1 px-4 py-2 bg-accent text-primary rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publicando...' : 'Publicar Venta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}











