import React from 'react';

console.warn('[DEPRECATED] RealNotificationsPanel.tsx has been moved to trash. Please use NotificationsPanel.tsx instead.');

interface RealNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export default function RealNotificationsPanel({ 
  isOpen, 
  onClose, 
  userId 
}: RealNotificationsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            [DEPRECATED] RealNotificationsPanel component has been removed.
          </p>
          <p className="text-sm text-gray-400">
            Please use NotificationsPanel.tsx for notifications functionality.
          </p>
        </div>
      </div>
    </div>
  );
}