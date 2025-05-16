import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import { World } from '../interfaces';
import { generateWorld } from '../../backend/world-generator';

interface WorldContextType {
  world: World | null;
  updateWorld: (newWorld: World) => void;
}

const WorldContext = createContext<WorldContextType | undefined>(undefined);

export const WorldProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [world, setWorld] = useState<World | null>(null);

  useEffect(() => {
    setWorld(generateWorld());
  }, []);

  const updateWorld = (newWorld: World) => {
    setWorld(newWorld);
  };

  return (
    <WorldContext.Provider value={{ world, updateWorld }}>
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
