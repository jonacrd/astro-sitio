import React from 'react';
import ProfileDropdown from './ProfileDropdown';

export default function AuthButton() {
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return <ProfileDropdown onNavigate={handleNavigate} />;
}
