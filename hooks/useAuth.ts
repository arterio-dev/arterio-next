'use client';

import { useContext } from 'react';
import { AuthContext } from '@/app/providers/AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
