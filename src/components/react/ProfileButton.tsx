import React, { useState, useEffect } from 'react';
import { getUser, getUserProfile } from '../../lib/session';

export default function ProfileButton() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
        const profileData = await getUserProfile();
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="/perfil"
        className="flex items-center space-x-3 bg-white rounded-full shadow-lg px-4 py-3 hover:shadow-xl transition-all duration-200 border border-gray-200"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-gray-900">
            {profile?.name || 'Mi Perfil'}
          </div>
          <div className="text-xs text-gray-500">
            {profile?.is_seller ? 'Vendedor' : 'Comprador'}
          </div>
        </div>
        <div className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>
    </div>
  );
}





