// Tipos compartidos para el sistema de delivery

export type LatLng = { 
  lat: number; 
  lng: number; 
};

export type Place = { 
  address: string; 
  latlng?: LatLng; 
};

export type DeliveryStatus =
  | "pending" 
  | "offer_sent" 
  | "assigned"
  | "pickup_confirmed" 
  | "en_route" 
  | "delivered"
  | "no_courier" 
  | "cancelled";

export type OfferStatus = 
  | "offered" 
  | "accepted" 
  | "declined" 
  | "expired";

// Entidades principales
export interface Courier {
  id: string;
  userId: string;
  name: string;
  phone: string;
  isActive: boolean;
  isAvailable: boolean;
  lastLat?: number;
  lastLng?: number;
  updatedAt: Date;
}

export interface Delivery {
  id: string;
  orderId: string;
  sellerId: string;
  courierId?: string;
  status: DeliveryStatus;
  pickup: Place;
  dropoff: Place;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryOffer {
  id: string;
  deliveryId: string;
  courierId: string;
  status: OfferStatus;
  expiresAt: Date;
  createdAt: Date;
}

// DTOs para API
export interface CreateDeliveryRequest {
  orderId: string;
  sellerId: string;
  pickup: Place;
  dropoff: Place;
}

export interface UpdateCourierAvailabilityRequest {
  isAvailable: boolean;
  lat?: number;
  lng?: number;
}

export interface UpdateDeliveryStatusRequest {
  status: DeliveryStatus;
}

export interface DeliveryAvailabilityResponse {
  anyAvailable: boolean;
  count: number;
}

// Resultados de operaciones
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
