import React from 'react';
import { UiBottomNav } from './UiBottomNav';
import EmergencyBottomNav from '../react/EmergencyBottomNav';

export function BottomNavWrapper() {
  return (
    <UiBottomNav>
      <EmergencyBottomNav />
    </UiBottomNav>
  );
}


