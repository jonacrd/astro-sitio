export interface TourStep {
  id: string;
  selector: string;
  title: string;
  content: string;
  townySlotClass?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: number;
}

export interface TourOptions {
  overlayOpacity?: number;
  spotlightPadding?: number;
  animationDuration?: number;
  allowKeyboardNavigation?: boolean;
  allowClickOutside?: boolean;
}

export interface TourCallbacks {
  onStart?: () => void;
  onStep?: (step: TourStep, index: number) => void;
  onComplete?: () => void;
  onSkip?: () => void;
  onError?: (error: Error) => void;
}

export interface TourInstance {
  start: () => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  skipStep: () => void;
  destroy: () => void;
  getCurrentStep: () => number;
  getTotalSteps: () => number;
}

