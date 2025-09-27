import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase-browser';
import { cartStore } from '../../lib/cart-store';

interface SearchBarAIProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  onAddToCart?: (productId: string, product: SearchResult) => void;
  onViewProduct?: (productId: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  vendor: string;
  sellerId?: string; // UUID del vendedor para la API
}

export default function SearchBarAI({ 
  onSubmit, 
  placeholder = "¿Qué necesitas? Ej: servicios, perros calientes, impresiones...",
  onAddToCart,
  onViewProduct
}: SearchBarAIProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await performAISearch(query.trim());
    }
  };

  const performAISearch = async (searchQuery: string) => {
    try {
      setIsSearching(true);
      setShowResults(true);

      // Procesar la consulta con IA
      const processedQuery = await processQueryWithAI(searchQuery);
      
      // Simular búsqueda con datos reales de ejemplo (evitar error de Supabase)
      const mockResults = generateMockSearchResults(processedQuery);
      setResults(mockResults);

      // Llamar al callback del padre si existe
      if (onSubmit) {
        onSubmit(processedQuery);
      }

    } catch (error) {
      console.error('Error in AI search:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Función para generar resultados mock basados en la consulta
  const generateMockSearchResults = (query: string): SearchResult[] => {
    const queryLower = query.toLowerCase();
    
    // Base de datos mock de productos reales
    const mockProducts = [
      // COMIDA - Productos más económicos primero
      {
        id: 'empanada-1',
        title: 'Empanadas de Pollo',
        description: 'Empanadas caseras de pollo con salsa',
        price: 2000,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Comida',
        vendor: 'Cocina de Mamá',
        sellerId: 'seller-6',
        isActive: true,
        hasDelivery: true
      },
      {
        id: 'hotdog-1',
        title: 'Hot Dog Especial',
        description: 'Perro caliente con todos los ingredientes',
        price: 2500,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Comida',
        vendor: 'Food Truck Central',
        sellerId: 'seller-5',
        isActive: true,
        hasDelivery: true
      },
      {
        id: 'cachapa-1',
        title: 'Cachapa con Queso',
        description: 'Tradicional venezolana con queso fresco y mantequilla',
        price: 3500,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Comida',
        vendor: 'Minimarket La Esquina',
        sellerId: 'seller-1',
        isActive: true,
        hasDelivery: true
      },
      {
        id: 'hamburguesa-1',
        title: 'Hamburguesa Clásica',
        description: 'Hamburguesa con carne, lechuga, tomate y queso',
        price: 4500,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Comida',
        vendor: 'Burger House',
        sellerId: 'seller-7',
        isActive: true,
        hasDelivery: true
      },
      {
        id: 'asador-1',
        title: 'Asador de Pollo',
        description: 'Pollo entero asado con especias y papas',
        price: 8000,
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Comida',
        vendor: 'Restaurante El Buen Sabor',
        sellerId: 'seller-2',
        isActive: true,
        hasDelivery: true
      },
      
      // TECNOLOGÍA - Productos más económicos primero
      {
        id: 'cable-usb-1',
        title: 'Cable USB-C 2m',
        description: 'Cable USB-C para carga rápida y transferencia de datos',
        price: 8000,
        image_url: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Tecnología',
        vendor: 'TechStore',
        sellerId: 'seller-3',
        isActive: true,
        hasDelivery: true
      },
      {
        id: 'powerbank-1',
        title: 'Power Bank 10000mAh',
        description: 'Carga rápida USB-C para todos tus dispositivos',
        price: 15000,
        image_url: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Tecnología',
        vendor: 'TechStore',
        sellerId: 'seller-3',
        isActive: true,
        hasDelivery: true
      },
      {
        id: 'mouse-1',
        title: 'Mouse Inalámbrico',
        description: 'Mouse inalámbrico ergonómico para oficina',
        price: 25000,
        image_url: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Tecnología',
        vendor: 'TechStore',
        sellerId: 'seller-3',
        isActive: false,
        hasDelivery: true
      },
      
      // SERVICIOS
      {
        id: 'limpieza-1',
        title: 'Limpieza Profesional',
        description: 'Servicio de limpieza para hogar y oficina',
        price: 45000,
        image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Servicios',
        vendor: 'CleanPro Services',
        sellerId: 'seller-4',
        isActive: false,
        hasDelivery: false
      },
      {
        id: 'peluqueria-1',
        title: 'Corte de Cabello',
        description: 'Corte profesional para hombres y mujeres',
        price: 12000,
        image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Servicios',
        vendor: 'Salon Belleza',
        sellerId: 'seller-8',
        isActive: true,
        hasDelivery: false
      },
      {
        id: 'mecanico-1',
        title: 'Servicio Mecánico',
        description: 'Revisión y mantenimiento de vehículos',
        price: 35000,
        image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'Servicios',
        vendor: 'Taller El Motor',
        sellerId: 'seller-9',
        isActive: true,
        hasDelivery: false
      }
    ];

    // Filtrar productos basado en la consulta
    const filteredProducts = mockProducts.filter(product => {
      const searchTerms = [
        product.title.toLowerCase(),
        product.description.toLowerCase(),
        product.category.toLowerCase(),
        product.vendor.toLowerCase()
      ];
      
      return searchTerms.some(term => term.includes(queryLower)) ||
             queryLower.includes(product.category.toLowerCase()) ||
             queryLower.includes('comida') && product.category === 'Comida' ||
             queryLower.includes('tecnologia') && product.category === 'Tecnología' ||
             queryLower.includes('servicio') && product.category === 'Servicios';
    });

    // Si no hay resultados directos, agregar productos relacionados de la misma categoría
    if (filteredProducts.length === 0) {
      const categoryMatch = mockProducts.find(product => 
        queryLower.includes(product.category.toLowerCase())
      );
      
      if (categoryMatch) {
        const relatedProducts = mockProducts.filter(product => 
          product.category === categoryMatch.category
        );
        filteredProducts.push(...relatedProducts.slice(0, 4)); // Máximo 4 productos relacionados
      }
    }

    // Si aún no hay resultados, mostrar productos más económicos
    if (filteredProducts.length === 0) {
      const cheapestProducts = mockProducts
        .filter(product => product.isActive) // Solo vendedores activos
        .sort((a, b) => a.price - b.price)
        .slice(0, 3); // Top 3 más económicos
      filteredProducts.push(...cheapestProducts);
    }

    // Ordenar por: vendedor activo primero, luego por precio (más económico primero)
    const sortedProducts = filteredProducts.sort((a, b) => {
      // Vendedor activo primero
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Luego por precio (más económico primero)
      return a.price - b.price;
    });

    // Convertir a formato SearchResult
    return sortedProducts.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      vendor: product.vendor,
      sellerId: product.sellerId
    }));
  };

  const processQueryWithAI = async (query: string): Promise<string> => {
    // Procesamiento inteligente de consultas naturales
    const lowerQuery = query.toLowerCase();
    
    // Mapeo de consultas naturales a términos de búsqueda
    const queryMappings: { [key: string]: string } = {
      // Comida
      'comida': 'comida',
      'aliment': 'comida',
      'cachapa': 'cachapa',
      'pollo': 'pollo',
      'asado': 'asado',
      'hot dog': 'hot dog',
      'perro caliente': 'hot dog',
      'empanada': 'empanada',
      'hamburguesa': 'hamburguesa',
      'pizza': 'pizza',
      'arepa': 'arepa',
      'lasaña': 'lasaña',
      'tequeños': 'tequeños',
      
      // Bebidas
      'malta': 'malta',
      'coca': 'coca cola',
      'cerveza': 'cerveza',
      'agua': 'agua',
      'ron': 'ron',
      'whisky': 'whisky',
      'vodka': 'vodka',
      
      // Postres
      'torta': 'torta',
      'quesillo': 'quesillo',
      'flan': 'flan',
      
      // Servicios
      'servicio': 'servicio',
      'limpieza': 'limpieza',
      'mecanico': 'mecanico',
      'auto': 'auto',
      'carro': 'auto',
      'peluqueria': 'peluqueria',
      'corte': 'peluqueria',
      'manicure': 'manicure',
      'impresion': 'impresion',
      'foto': 'impresion',
      
      // Tecnología
      'tecnologia': 'tecnologia',
      'electronico': 'tecnologia',
      'power bank': 'power bank',
      'cargador': 'cargador',
      'telefono': 'telefono',
      'laptop': 'laptop',
      'computadora': 'computadora',
      
      // Minimarket
      'pan': 'pan',
      'leche': 'leche',
      'huevo': 'huevo',
      'supermercado': 'supermercado',
      
      // Delivery
      'delivery': 'delivery',
      'domicilio': 'delivery',
      'entrega': 'delivery',
      
      // Adjetivos de precio
      'barato': 'barato',
      'económico': 'barato',
      'caro': 'caro',
      'oferta': 'oferta',
      'descuento': 'descuento'
    };

    // Buscar coincidencias y devolver el término más relevante
    for (const [natural, technical] of Object.entries(queryMappings)) {
      if (lowerQuery.includes(natural)) {
        return technical;
      }
    }

    // Si no hay coincidencias, devolver la consulta original
    return query;
  };

  const getFallbackResults = (query: string): SearchResult[] => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('perro') || lowerQuery.includes('hot') || lowerQuery.includes('dog')) {
      return [
        {
          id: 'hotdog-fallback',
          title: 'Perro Caliente',
          description: 'Hot dog con todos los ingredientes',
          price: 2500,
          image_url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Comida',
          vendor: 'Max Snack'
        },
        {
          id: 'chili-dog-fallback',
          title: 'Chili Dog',
          description: 'Hot dog con chili y cebolla',
          price: 3000,
          image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Comida',
          vendor: 'Max Snack'
        },
        {
          id: 'papas-fallback',
          title: 'Papas Fritas',
          description: 'Papas fritas crujientes',
          price: 1500,
          image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Comida',
          vendor: 'Max Snack'
        }
      ];
    }
    
    if (lowerQuery.includes('comida') || lowerQuery.includes('cachapa') || lowerQuery.includes('pollo')) {
      return [
        {
          id: 'cachapa-fallback',
          title: 'Cachapa con Queso',
          description: 'Tradicional venezolana con queso fresco',
          price: 3500,
          image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Comida',
          vendor: 'Minimarket La Esquina'
        },
        {
          id: 'asador-fallback',
          title: 'Asador de Pollo',
          description: 'Pollo entero asado con especias',
          price: 8000,
          image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Comida',
          vendor: 'Restaurante El Buen Sabor'
        }
      ];
    }
    
    if (lowerQuery.includes('tecnologia') || lowerQuery.includes('power') || lowerQuery.includes('cargador') || lowerQuery.includes('cable')) {
      return [
        {
          id: 'powerbank-fallback',
          title: 'Power Bank 10000mAh',
          description: 'Cargador portátil de alta capacidad',
          price: 15000,
          image_url: 'https://images.unsplash.com/photo-1609592807900-4b0b4a0b4a0b?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Tecnología',
          vendor: 'TechStore Local'
        },
        {
          id: 'cable-fallback',
          title: 'Cable USB-C',
          description: 'Cable de carga rápida USB-C',
          price: 5000,
          image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Tecnología',
          vendor: 'TechStore Local'
        }
      ];
    }
    
    if (lowerQuery.includes('servicio') || lowerQuery.includes('limpieza')) {
      return [
        {
          id: 'limpieza-fallback',
          title: 'Limpieza Profesional',
          description: 'Servicio completo de limpieza para tu hogar',
          price: 45000,
          image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?auto=format&fit=crop&w=400&h=300&q=80',
          category: 'Servicios',
          vendor: 'CleanPro Services'
        }
      ];
    }

    // Resultados genéricos
    return [
      {
        id: 'generic-1',
        title: 'Producto encontrado',
        description: `Resultados para "${query}"`,
        price: 0,
        image_url: 'https://images.unsplash.com/photo-1513104890138-e1f88ed010f5?auto=format&fit=crop&w=400&h=300&q=80',
        category: 'General',
        vendor: 'Vendedor Local'
      }
    ];
  };

  const handleChipClick = async (chipQuery: string) => {
    setQuery(chipQuery);
    await performAISearch(chipQuery);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getSearchTitle = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('perro') || lowerQuery.includes('hot')) {
      return 'Perros calientes';
    }
    if (lowerQuery.includes('comida') || lowerQuery.includes('cachapa')) {
      return 'Comida tradicional';
    }
    if (lowerQuery.includes('tecnologia') || lowerQuery.includes('power')) {
      return 'Tecnología';
    }
    if (lowerQuery.includes('servicio') || lowerQuery.includes('limpieza')) {
      return 'Servicios';
    }
    
    return 'Productos';
  };

  const handleAddToCart = async (product: SearchResult) => {
    console.log('🛒 Intentando agregar al carrito:', product);
    
    // Usar UUID del vendedor para validación
    const sellerId = product.sellerId || '8f0a8848-8647-41e7-b9d0-323ee000d379';
    
    // Verificar restricción de vendedor único usando cart-store
    const canAdd = cartStore.canAddFromSeller(sellerId);
    
    if (!canAdd.canAdd) {
      alert(canAdd.message);
      return;
    }
    
    setSelectedProduct(product);
    setShowNotification(true);
  };

  const confirmAddToCart = async () => {
    if (selectedProduct) {
      try {
        console.log('✅ Confirmando agregar al carrito:', selectedProduct);
        
        // Usar API real en lugar de localStorage  
        // Usar UUID fijo para TechStore como ejemplo (en producción debería venir de la base de datos)
        const sellerId = selectedProduct.sellerId || '8f0a8848-8647-41e7-b9d0-323ee000d379'; // TechStore UUID
        
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sellerId: sellerId,
            productId: selectedProduct.id,
            title: selectedProduct.title,
            price_cents: selectedProduct.price * 100, // Convertir a centavos
            qty: 1
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Producto agregado al carrito vía API');
          
          // Actualizar cart-store
          cartStore.setActiveSeller(selectedProduct.vendor, selectedProduct.vendor);
          
          // Disparar evento de carrito actualizado
          const cartUpdateEvent = new CustomEvent('cart-updated', {
            detail: { 
              productId: selectedProduct.id,
              title: selectedProduct.title,
              vendor: selectedProduct.vendor
            }
          });
          window.dispatchEvent(cartUpdateEvent);
          
        } else {
          console.error('❌ Error agregando al carrito vía API:', result.error);
          
          // Fallback: localStorage con validación de vendedor
          console.log('🔄 Usando fallback localStorage...');
          
          const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
          
          // Verificar si hay items de diferentes vendedores
          if (existingCart.length > 0) {
            const currentVendor = existingCart[0].vendor;
            if (currentVendor !== selectedProduct.vendor) {
              const confirmReplace = confirm(
                `Tu carrito actual tiene productos de "${currentVendor}". ` +
                `¿Deseas reemplazar el carrito con productos de "${selectedProduct.vendor}"?`
              );
              
              if (!confirmReplace) {
                console.log('❌ Usuario canceló el cambio de vendedor');
                setShowNotification(false);
                return;
              }
              
              // Limpiar carrito actual
              localStorage.setItem('cart', '[]');
              console.log('🧹 Carrito limpiado para cambiar vendedor');
            }
          }
          
          const cartItem = {
            id: selectedProduct.id,
            title: selectedProduct.title,
            price: selectedProduct.price,
            image: selectedProduct.image_url,
            vendor: selectedProduct.vendor,
            quantity: 1,
            addedAt: new Date().toISOString()
          };
          
          const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]');
          const existingItemIndex = updatedCart.findIndex((item: any) => item.id === selectedProduct.id);
          
          if (existingItemIndex >= 0) {
            updatedCart[existingItemIndex].quantity += 1;
          } else {
            updatedCart.push(cartItem);
          }
          
          localStorage.setItem('cart', JSON.stringify(updatedCart));
          
          // Disparar evento personalizado
          window.dispatchEvent(new CustomEvent('cart-updated', { 
            detail: { 
              item: cartItem, 
              action: existingItemIndex >= 0 ? 'update' : 'add',
              cart: updatedCart
            } 
          }));
          
          console.log('✅ Fallback completado');
        }
        
        // Cerrar modal
        setShowNotification(false);
        setSelectedProduct(null);
        
        // Mostrar notificación de éxito
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = `✅ ${selectedProduct.title} agregado al carrito`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 3000);
        
        console.log('✅ Producto agregado al carrito:', selectedProduct.title);
        
      } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
        
        // Mostrar notificación de error
        const errorNotification = document.createElement('div');
        errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorNotification.textContent = `❌ Error al agregar ${selectedProduct.title}`;
        document.body.appendChild(errorNotification);
        
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 3000);
      }
    }
  };

  const cancelAddToCart = () => {
    setShowNotification(false);
    setSelectedProduct(null);
  };

  const handleViewProduct = (product: SearchResult) => {
    if (onViewProduct) {
      onViewProduct(product.id);
    }
  };

  const chips = [
    "vecinos del edificio",
    "hot dogs", 
    "delivery",
    "impresiones",
    "peluquería",
    "mecánica"
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-4 bg-surface/80 border border-white/10 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200"
            aria-label="Búsqueda de productos y servicios"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </form>

      {/* Chips de ejemplo */}
      <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-2">
        {chips.map((chip, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(chip)}
            className="flex-shrink-0 px-4 py-2 bg-muted/50 text-white text-sm rounded-full hover:bg-muted/70 transition-colors duration-200 scroll-snap-start"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Tip */}
      <p className="text-center text-white/70 text-sm mt-3">
        💡 Pregúntale como en el grupo de WhatsApp. La IA entiende tus mensajes.
      </p>

      {/* Resultados de búsqueda - Diseño como la tercera imagen */}
      {showResults && (
        <div className="mt-6 bg-surface/30 rounded-2xl overflow-hidden">
          {/* Header con botón cerrar */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg">
                Resultado de búsqueda
              </h3>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {results.length > 0 ? (
            <div className="p-4">
              {/* Banner promocional */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👨‍🍳</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg">
                      {getSearchTitle(query)} con delivery gratis ahora:
                    </h4>
                  </div>
                </div>
              </div>

              {/* Producto principal */}
              <div className="mb-6">
                <div className="bg-muted/20 rounded-xl overflow-hidden">
                  <div className="relative">
                    <img
                      src={results[0].image_url}
                      alt={results[0].title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        DISPONIBLE AHORA
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-white font-bold text-lg mb-1">
                      {results[0].title}
                    </h4>
                    <p className="text-white/70 text-sm mb-2">
                      {results[0].vendor}
                    </p>
                    <p className="text-white/60 text-sm mb-3">
                      Envío gratis
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-accent font-bold text-xl">
                        {formatPrice(results[0].price)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(results[0])}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors"
                      >
                        PEDIR AHORA
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos relacionados */}
              {results.length > 1 && (
                <div>
                  <h5 className="text-white font-semibold text-lg mb-4">
                    Productos relacionados
                  </h5>
                  <div className="flex gap-4 overflow-x-auto scroll-snap-x pb-2">
                    {results.slice(1).map((result) => (
                      <div
                        key={result.id}
                        className="flex-shrink-0 w-32 cursor-pointer"
                        onClick={() => handleViewProduct(result)}
                      >
                        <div className="bg-muted/20 rounded-xl overflow-hidden">
                          <img
                            src={result.image_url}
                            alt={result.title}
                            className="w-full h-24 object-cover"
                          />
                          <div className="p-2">
                            <h6 className="text-white font-medium text-sm truncate">
                              {result.title}
                            </h6>
                            <p className="text-white/70 text-xs truncate">
                              {result.vendor}
                            </p>
                            <p className="text-accent font-bold text-xs mt-1">
                              {result.price > 0 ? formatPrice(result.price) : 'Consultar'}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🛒 Botón Agregar clickeado para:', result.title);
                                handleAddToCart(result);
                              }}
                              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h4 className="text-white font-semibold text-lg mb-2">
                No se encontraron resultados
              </h4>
              <p className="text-white/60 text-sm mb-4">
                No hay productos disponibles para "{query}"
              </p>
              <p className="text-white/40 text-xs">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación para agregar al carrito */}
      {showNotification && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-white font-bold text-lg mb-2">
                ¿Agregar al carrito?
              </h3>
              <p className="text-white/70 text-sm mb-4">
                {selectedProduct.title} - {formatPrice(selectedProduct.price)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelAddToCart}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAddToCart}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


