// Estado global simple para el feed de resultados
interface SearchResult {
  productId: string;
  productTitle: string;
  category: string;
  price: string;
  sellerId: string;
  sellerName: string;
  online: boolean;
  delivery: boolean;
  stock: number;
  sellerProductId: string;
  productUrl: string;
  addToCartUrl: string;
}

interface FeedState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}

class FeedStore {
  private state: FeedState = {
    query: '',
    results: [],
    loading: false,
    error: null
  };

  private listeners: Array<() => void> = [];

  getState() {
    return this.state;
  }

  setResults(query: string, results: SearchResult[]) {
    this.state = {
      ...this.state,
      query,
      results,
      loading: false,
      error: null
    };
    this.notify();
  }

  setLoading(loading: boolean) {
    this.state = { ...this.state, loading };
    this.notify();
  }

  setError(error: string | null) {
    this.state = { ...this.state, error, loading: false };
    this.notify();
  }

  clearResults() {
    this.state = {
      query: '',
      results: [],
      loading: false,
      error: null
    };
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

export const feedStore = new FeedStore();
export type { SearchResult };





