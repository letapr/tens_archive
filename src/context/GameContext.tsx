'use client';

import React, { createContext, useContext, useState } from 'react';
import { GAME_CONFIG } from '../utils/dynamodb';

interface GameContextType {
  lives: number;
  setLives: (lives: number) => void;
  addLife: () => void;
  canAddLife: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [lives, setLives] = useState<number>(GAME_CONFIG.maxLives);

  const addLife = () => {
    if (lives < GAME_CONFIG.maxLives) {
      setLives(lives + 1);
    }
  };

  const canAddLife = lives < GAME_CONFIG.maxLives;

  return (
    <GameContext.Provider value={{ lives, setLives, addLife, canAddLife }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}