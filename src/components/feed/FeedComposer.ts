// =============================================
// FEED COMPOSER - MEZCLADOR DE CONTENIDO
// =============================================

export interface FeedItem {
  id: string;
  type: 'product' | 'express' | 'question';
  data: any;
  order: number;
  timestamp: string;
}

export interface FeedSource {
  products: {
    items: any[];
    nextCursor?: string;
    hasMore: boolean;
  };
  express: {
    items: any[];
    nextCursor?: string;
    hasMore: boolean;
  };
  questions: {
    items: any[];
    nextCursor?: string;
    hasMore: boolean;
  };
}

export interface FeedComposerConfig {
  productRatio: number; // 6 productos
  expressRatio: number; // 3 express
  questionRatio: number; // 1 pregunta
  stopCardFrequency: number; // Cada 6 productos
}

// =============================================
// CONFIGURACIÓN POR DEFECTO
// =============================================

const DEFAULT_CONFIG: FeedComposerConfig = {
  productRatio: 6,
  expressRatio: 3,
  questionRatio: 1,
  stopCardFrequency: 6
};

// =============================================
// FUNCIÓN PRINCIPAL DEL FEED COMPOSER
// =============================================

export function createFeedComposer(config: FeedComposerConfig = DEFAULT_CONFIG) {
  let currentOrder = 0;
  let productCount = 0;
  let expressCount = 0;
  let questionCount = 0;
  let totalItems = 0;

  return {
    // Componer feed con las 3 fuentes
    composeFeed(sources: FeedSource): FeedItem[] {
      const feedItems: FeedItem[] = [];
      const { products, express, questions } = sources;

      // Algoritmo de mezcla inteligente
      while (this.hasMoreContent(sources)) {
        // 1. Agregar productos (6 por ciclo)
        for (let i = 0; i < config.productRatio && products.items.length > 0; i++) {
          const product = products.items.shift();
          if (product) {
            feedItems.push({
              id: `product-${product.id}`,
              type: 'product',
              data: product,
              order: currentOrder++,
              timestamp: product.created_at || new Date().toISOString()
            });
            productCount++;
            totalItems++;
          }
        }

        // 2. Agregar StopCard cada 6 productos
        if (productCount % config.stopCardFrequency === 0 && productCount > 0) {
          feedItems.push({
            id: `stop-${totalItems}`,
            type: 'product',
            data: { isStopCard: true, message: 'Más productos disponibles' },
            order: currentOrder++,
            timestamp: new Date().toISOString()
          });
        }

        // 3. Agregar express posts (3 por ciclo)
        for (let i = 0; i < config.expressRatio && express.items.length > 0; i++) {
          const expressPost = express.items.shift();
          if (expressPost) {
            feedItems.push({
              id: `express-${expressPost.id}`,
              type: 'express',
              data: expressPost,
              order: currentOrder++,
              timestamp: expressPost.created_at || new Date().toISOString()
            });
            expressCount++;
            totalItems++;
          }
        }

        // 4. Agregar pregunta (1 por ciclo)
        if (questions.items.length > 0) {
          const question = questions.items.shift();
          if (question) {
            feedItems.push({
              id: `question-${question.id}`,
              type: 'question',
              data: question,
              order: currentOrder++,
              timestamp: question.created_at || new Date().toISOString()
            });
            questionCount++;
            totalItems++;
          }
        }

        // 5. Si no hay más contenido de un tipo, rellenar con otros
        if (!this.hasMoreContent(sources)) {
          this.fillWithRemainingContent(sources, feedItems);
        }
      }

      return feedItems.sort((a, b) => a.order - b.order);
    },

    // Verificar si hay más contenido disponible
    hasMoreContent(sources: FeedSource): boolean {
      return sources.products.hasMore || 
             sources.express.hasMore || 
             sources.questions.hasMore ||
             sources.products.items.length > 0 ||
             sources.express.items.length > 0 ||
             sources.questions.items.length > 0;
    },

    // Rellenar con contenido restante cuando una fuente se agota
    fillWithRemainingContent(sources: FeedSource, feedItems: FeedItem[]): void {
      // Agregar productos restantes
      while (sources.products.items.length > 0) {
        const product = sources.products.items.shift();
        if (product) {
          feedItems.push({
            id: `product-${product.id}`,
            type: 'product',
            data: product,
            order: currentOrder++,
            timestamp: product.created_at || new Date().toISOString()
          });
        }
      }

      // Agregar express posts restantes
      while (sources.express.items.length > 0) {
        const expressPost = sources.express.items.shift();
        if (expressPost) {
          feedItems.push({
            id: `express-${expressPost.id}`,
            type: 'express',
            data: expressPost,
            order: currentOrder++,
            timestamp: expressPost.created_at || new Date().toISOString()
          });
        }
      }

      // Agregar preguntas restantes
      while (sources.questions.items.length > 0) {
        const question = sources.questions.items.shift();
        if (question) {
          feedItems.push({
            id: `question-${question.id}`,
            type: 'question',
            data: question,
            order: currentOrder++,
            timestamp: question.created_at || new Date().toISOString()
          });
        }
      }
    },

    // Obtener estadísticas del feed
    getStats() {
      return {
        totalItems,
        productCount,
        expressCount,
        questionCount,
        currentOrder
      };
    },

    // Resetear contadores
    reset() {
      currentOrder = 0;
      productCount = 0;
      expressCount = 0;
      questionCount = 0;
      totalItems = 0;
    }
  };
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

export function createEmptyFeedSource(): FeedSource {
  return {
    products: { items: [], nextCursor: undefined, hasMore: true },
    express: { items: [], nextCursor: undefined, hasMore: true },
    questions: { items: [], nextCursor: undefined, hasMore: true }
  };
}

export function mergeFeedSources(existing: FeedSource, newData: Partial<FeedSource>): FeedSource {
  return {
    products: {
      items: [...existing.products.items, ...(newData.products?.items || [])],
      nextCursor: newData.products?.nextCursor || existing.products.nextCursor,
      hasMore: newData.products?.hasMore ?? existing.products.hasMore
    },
    express: {
      items: [...existing.express.items, ...(newData.express?.items || [])],
      nextCursor: newData.express?.nextCursor || existing.express.nextCursor,
      hasMore: newData.express?.hasMore ?? existing.express.hasMore
    },
    questions: {
      items: [...existing.questions.items, ...(newData.questions?.items || [])],
      nextCursor: newData.questions?.nextCursor || existing.questions.nextCursor,
      hasMore: newData.questions?.hasMore ?? existing.questions.hasMore
    }
  };
}

// =============================================
// UTILIDADES DE PAGINACIÓN
// =============================================

export interface PaginationState {
  products: { cursor?: string; hasMore: boolean };
  express: { cursor?: string; hasMore: boolean };
  questions: { cursor?: string; hasMore: boolean };
}

export function createPaginationState(): PaginationState {
  return {
    products: { cursor: undefined, hasMore: true },
    express: { cursor: undefined, hasMore: true },
    questions: { cursor: undefined, hasMore: true }
  };
}

export function updatePaginationState(
  state: PaginationState,
  updates: Partial<PaginationState>
): PaginationState {
  return {
    products: { ...state.products, ...updates.products },
    express: { ...state.express, ...updates.express },
    questions: { ...state.questions, ...updates.questions }
  };
}

// =============================================
// UTILIDADES DE ORDENAMIENTO
// =============================================

export function sortFeedItemsByTimestamp(items: FeedItem[]): FeedItem[] {
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function sortFeedItemsByOrder(items: FeedItem[]): FeedItem[] {
  return items.sort((a, b) => a.order - b.order);
}

// =============================================
// UTILIDADES DE FILTRADO
// =============================================

export function filterFeedItemsByType(items: FeedItem[], type: 'product' | 'express' | 'question'): FeedItem[] {
  return items.filter(item => item.type === type);
}

export function getFeedItemById(items: FeedItem[], id: string): FeedItem | undefined {
  return items.find(item => item.id === id);
}

export function getFeedItemsByTimestampRange(
  items: FeedItem[], 
  startDate: string, 
  endDate: string
): FeedItem[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return items.filter(item => {
    const itemTime = new Date(item.timestamp).getTime();
    return itemTime >= start && itemTime <= end;
  });
}








