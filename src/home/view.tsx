// Home module - Professional terminal interface
import React from 'react';
import { ProfessionalThemeProvider } from '../components/ProfessionalThemeProvider';
import { ProfessionalTerminalLayout } from '../components/ProfessionalTerminalLayout';

export const HomeView: React.FC = () => {
  return (
    <ProfessionalThemeProvider>
      <ProfessionalTerminalLayout />
    </ProfessionalThemeProvider>
  );
};
