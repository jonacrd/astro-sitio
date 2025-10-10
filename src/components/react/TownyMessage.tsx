import React from 'react';

interface TownyMessageProps {
  type: 'error' | 'warning' | 'success' | 'loading' | 'checkout' | 'confused' | 'happy' | 'thumbs-up' | 'sad' | 'angry' | 'goodbye';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  size?: 'small' | 'normal' | 'large';
  className?: string;
}

export default function TownyMessage({
  type,
  title,
  message,
  actions = [],
  size = 'normal',
  className = ''
}: TownyMessageProps) {
  const sizeClass = size === 'small' ? 'towny--small' : size === 'large' ? 'towny--large' : '';
  
  return (
    <div className={`towny-container ${sizeClass} ${className}`}>
      <div className={`towny-image towny--${type}`} />
      <h3 className="towny-title">{title}</h3>
      <p className="towny-message">{message}</p>
      
      {actions.length > 0 && (
        <div className="towny-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`towny-btn towny-btn--${action.variant || 'primary'}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente específico para páginas de error
export function TownyErrorPage({
  title = "¡Ups! Algo salió mal",
  message = "Parece que hubo un problema. Por favor, intenta de nuevo.",
  actions = []
}: {
  title?: string;
  message?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}) {
  return (
    <div className="towny-error-page">
      <div className="towny-error-content">
        <TownyMessage
          type="error"
          title={title}
          message={message}
          actions={actions}
          size="large"
        />
      </div>
    </div>
  );
}

// Componente específico para checkout
export function TownyCheckout({
  title = "¡Casi listo!",
  message = "Revisa tu pedido y completa la compra."
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="towny-checkout">
      <div className="towny-image towny--checkout" />
      <h3 className="towny-title">{title}</h3>
      <p className="towny-message">{message}</p>
    </div>
  );
}

// Componente para modales con Towny
export function TownyModal({
  type,
  title,
  message,
  actions = [],
  onClose,
  isOpen = false
}: {
  type: TownyMessageProps['type'];
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  onClose?: () => void;
  isOpen?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="towny-modal">
      <div className="towny-modal__overlay" onClick={onClose} />
      <div className="towny-modal__content">
        <TownyMessage
          type={type}
          title={title}
          message={message}
          actions={actions}
        />
      </div>
    </div>
  );
}

