import React from 'react';
import DynamicGridBlock from '../feed/DynamicGridBlock';
import { useRealProducts } from '../../hooks/useRealProducts';

interface DynamicGridBlocksProps {
  onAddToCart: (productId: string) => void;
  onViewProduct: (productId: string) => void;
  onContactService: (serviceId: string) => void;
}

export default function DynamicGridBlocks({ onAddToCart, onViewProduct, onContactService }: DynamicGridBlocksProps) {
  console.log('🧩 DynamicGridBlocks: Renderizando...');
  const { products, loading, error } = useRealProducts();
  console.log('🧩 DynamicGridBlocks: Estado:', { products: products.length, loading, error });

  // Patrón asimétrico para el mosaico - exacto como en las imágenes
  const asymmetricPattern: ("tall"|"short")[] = ["tall", "short", "short", "tall"];

  if (loading) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/60 text-lg">Cargando productos destacados...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 mb-6">
        <div className="max-w-[400px] mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">⚠️ Error al cargar productos</div>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="max-w-[400px] mx-auto">
        {/* MOSAICO ASIMÉTRICO CON DATOS REALES - BLOQUES PEQUEÑOS */}
        <DynamicGridBlock 
          items={products}
          pattern={asymmetricPattern}
        />
      </div>
    </section>
  );
}