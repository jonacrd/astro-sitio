import React from 'react';

interface QuickActionsProps {
  onPublishSale: () => void;
}

export default function QuickActions({ onPublishSale }: QuickActionsProps) {
  return (
    <div className="px-4 mb-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center">
          {/* Solo Venta Express */}
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
      </div>
    </div>
  );
}