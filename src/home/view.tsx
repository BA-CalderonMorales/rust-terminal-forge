// Home module - Professional terminal interface with mobile optimizations
import React from 'react';
import { ProfessionalThemeProvider } from '../components/ProfessionalThemeProvider';
import { ProfessionalTerminalLayout } from '../components/ProfessionalTerminalLayout';
import { MobileViewportProvider } from '../components/MobileViewportProvider';

export const HomeView: React.FC = () => {
  return (
    <MobileViewportProvider>
      <ProfessionalThemeProvider>
        <ProfessionalTerminalLayout />
      </ProfessionalThemeProvider>
    </MobileViewportProvider>
  );
};
