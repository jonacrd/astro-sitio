import React from 'react';
import { AuthProvider } from './AuthContext';
import MixedFeedSimple from './MixedFeedSimple';

interface AuthWrapperProps {
  userId?: string;
  className?: string;
}

export default function AuthWrapper({ userId, className = '' }: AuthWrapperProps) {
  return (
    <AuthProvider>
      <MixedFeedSimple className={className} />
    </AuthProvider>
  );
}
