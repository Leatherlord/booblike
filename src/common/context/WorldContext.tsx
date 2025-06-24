import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import { World } from '../interfaces';
import { WorldManager } from '../../backend/world-manager';
import { Event } from '../events';

interface WorldContextType {
  world: World | null;
  handleEvent: (event: Event) => void;
  restartGame: () => void;
  saveGame: () => string;
  loadGame: (saveData: string) => void;
}

const WorldContext = createContext<WorldContextType | undefined>(undefined);

export const WorldProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [world, setWorld] = useState<World | null>(null);
  const worldManagerRef = useRef<WorldManager | null>(null);

  useEffect(() => {
    worldManagerRef.current = new WorldManager(setWorld);
    worldManagerRef.current.generateStubWorld();

    return () => {
      worldManagerRef.current?.cleanup();
    };
  }, [setWorld]);

  const handleEvent = (event: Event) => {
    worldManagerRef.current?.handleEvent(event);
  };

  const restartGame = () => {
    worldManagerRef.current?.restartGame();
  };

  const saveGame = () => {
    if (!worldManagerRef.current) {
      throw new Error('WorldManager not initialized');
    }
    return worldManagerRef.current.saveGame();
  };

  const loadGame = (saveData: string) => {
    if (!worldManagerRef.current) {
      throw new Error('WorldManager not initialized');
    }
    worldManagerRef.current.loadGame(saveData);
  };

  return (
    <WorldContext.Provider
      value={{ world, handleEvent, restartGame, saveGame, loadGame }}
    >
      {children}
    </WorldContext.Provider>
  );
};

export const useWorld = (): WorldContextType => {
  const context = useContext(WorldContext);
  if (context === undefined) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
};
