import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

/**
 * GameDataContext
 * 
 * Provides centralized game data management for components.
 * Fetches all game data via API on app initialization and caches it.
 * Reduces API calls by sharing cached data via Context API.
 * 
 * Requirements: 9.1, 9.5, 9.6
 */

/**
 * Type definitions for game data
 */
export interface AttributeCosts {
  speed: Record<string, number>;
  defense: Record<string, number>;
  firepower: Record<string, number>;
  prowess: Record<string, number>;
  willpower: Record<string, number>;
}

export interface Weapon {
  id: string;
  name: string;
  type: 'close' | 'ranged';
  baseCost: number;
  maxActions?: number;
  range?: string;
  notes: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  baseCost: number;
  effect: string;
}

export interface PsychicPower {
  id: string;
  name: string;
  type: string;
  cost: number;
  effect: string;
}

export interface LeaderTrait {
  id: string;
  name: string;
  description: string;
}

export interface WarbandAbility {
  id: string;
  name: string;
  description: string;
  rule: string;
}

/**
 * Context value interface
 */
interface GameDataContextValue {
  // Game data
  attributes: AttributeCosts | null;
  closeCombatWeapons: Weapon[];
  rangedWeapons: Weapon[];
  equipment: Equipment[];
  psychicPowers: PsychicPower[];
  leaderTraits: LeaderTrait[];
  warbandAbilities: WarbandAbility[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Retry function
  refetch: () => Promise<void>;
}

/**
 * Create context with undefined default
 */
const GameDataContext = createContext<GameDataContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface GameDataProviderProps {
  children: ReactNode;
}



/**
 * GameDataProvider component
 * 
 * Fetches all game data on mount and provides it to child components.
 * Handles loading and error states.
 * 
 * Requirements: 9.1, 9.5, 9.6
 */
export function GameDataProvider({ children }: GameDataProviderProps) {
  const [attributes, setAttributes] = useState<AttributeCosts | null>(null);
  const [closeCombatWeapons, setCloseCombatWeapons] = useState<Weapon[]>([]);
  const [rangedWeapons, setRangedWeapons] = useState<Weapon[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [psychicPowers, setPsychicPowers] = useState<PsychicPower[]>([]);
  const [leaderTraits, setLeaderTraits] = useState<LeaderTrait[]>([]);
  const [warbandAbilities, setWarbandAbilities] = useState<WarbandAbility[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all game data from API using API client
   * Requirements: 9.1, 9.5
   */
  const fetchGameData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all game data in parallel using API client for better performance
      const [
        attributesData,
        closeCombatData,
        rangedData,
        equipmentData,
        powersData,
        traitsData,
        abilitiesData,
      ] = await Promise.all([
        apiClient.getAttributes(),
        apiClient.getCloseCombatWeapons(),
        apiClient.getRangedWeapons(),
        apiClient.getEquipment(),
        apiClient.getPsychicPowers(),
        apiClient.getLeaderTraits(),
        apiClient.getWarbandAbilities(),
      ]);

      // Update state with fetched data (Requirements 9.1, 9.6)
      // Type assertions safe: API responses are validated JSON data matching our interface definitions
      setAttributes(attributesData as AttributeCosts);
      // Type assertion safe: API response contains Weapon array
      setCloseCombatWeapons(closeCombatData as Weapon[]);
      // Type assertion safe: API response contains Weapon array
      setRangedWeapons(rangedData as Weapon[]);
      // Type assertion safe: API response contains Equipment array
      setEquipment(equipmentData as Equipment[]);
      // Type assertion safe: API response contains PsychicPower array
      setPsychicPowers(powersData as PsychicPower[]);
      // Type assertion safe: API response contains LeaderTrait array
      setLeaderTraits(traitsData as LeaderTrait[]);
      // Type assertion safe: API response contains WarbandAbility array
      setWarbandAbilities(abilitiesData as WarbandAbility[]);
      
      setIsLoading(false);
    } catch (error: unknown) {
      // Type assertion: Error handling with proper type checking
      const errorMessage = error instanceof Error ? error.message : 'Failed to load game data';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Error fetching game data:', error);
    }
  };

  /**
   * Fetch game data on component mount
   * Requirements: 9.1
   */
  useEffect(() => {
    fetchGameData();
  }, []);

  const value: GameDataContextValue = {
    attributes,
    closeCombatWeapons,
    rangedWeapons,
    equipment,
    psychicPowers,
    leaderTraits,
    warbandAbilities,
    isLoading,
    error,
    refetch: fetchGameData,
  };

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  );
}

/**
 * Custom hook to access game data context
 * 
 * Throws error if used outside of GameDataProvider.
 * 
 * Requirements: 9.1, 9.5, 9.6
 * 
 * @returns GameDataContextValue
 */
export function useGameData(): GameDataContextValue {
  const context = useContext(GameDataContext);
  
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  
  return context;
}
