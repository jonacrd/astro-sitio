import React from 'react';
import AuthGuard from './AuthGuard';

interface QuickActionsProps {
  onAskQuestion: () => void;
  onPublishSale: () => void;
}

export default function QuickActions({ onAskQuestion, onPublishSale }: QuickActionsProps) {
  return (
    <div className="px-4 mb-4">
      <div className="max-w-7xl mx-auto">
        <AuthGuard
          fallback={
            <div className="text-center py-4">
              <p className="text-white/50 text-sm">Inicia sesión para hacer preguntas y publicar ventas</p>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Haz una pregunta - Más discreto */}
            <button
              onClick={onAskQuestion}
              className="btn-primary-opaque bg-opacity-80 hover:bg-opacity-90 border border-blue-500/30 rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium text-sm">Haz una pregunta</h3>
                  <p className="text-white/60 text-xs">A la comunidad</p>
                </div>
              </div>
            </button>

            {/* Publica una venta express - Más discreto */}
            <button
              onClick={onPublishSale}
              className="btn-primary-opaque bg-opacity-80 hover:bg-opacity-90 border border-blue-500/30 rounded-xl p-3 transition-all duration-200 hover:scale-[1.02] group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium text-sm">Venta Express</h3>
                  <p className="text-white/60 text-xs">24h</p>
                </div>
              </div>
            </button>
          </div>
        </AuthGuard>
      </div>
    </div>
  );
}