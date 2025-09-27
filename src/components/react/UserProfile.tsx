import React from 'react';

console.warn('[DEPRECATED] UserProfile.tsx has been moved to trash. Please use ProfileHub.tsx instead.');

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
}

interface UserProfileProps {
  onLogout: () => void;
}

export default function UserProfile({ onLogout }: UserProfileProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          [DEPRECATED] UserProfile component has been removed.
        </p>
        <p className="text-sm text-gray-400">
          Please use ProfileHub.tsx for user profile functionality.
        </p>
        <button
          onClick={onLogout}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}