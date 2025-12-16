import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
 * Loading progress interface for granular loading states
 */
interface LoadingProgress {
  attributes: 'pending' | 'loading' | 'success' | 'error';
  closeCombatWeapons: 'pending' | 'loading' | 'success' | 'error';
  rangedWeapons: 'pending' | 'loading' | 'success' | 'error';
  equipment: 'pending' | 'loading' | 'success' | 'error';
  psychicPowers: 'pending' | 'loading' | 'success' | 'error';
  leaderTraits: 'pending' | 'loading' | 'success' | 'error';
  warbandAbilities: 'pending' | 'loading' | 'success' | 'error';
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
  loadingProgress: LoadingProgress;
  
  // Retry functions
  refetch: () => Promise<void>;
  retryFailedRequests: () => Promise<void>;
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
 * API base URL configuration
 */
// Type assertion safe: import.meta.env is a Vite-specific object that TypeScript doesn't recognize
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

/**
 * GameDataProvider component
 * 
 * Fetches all game data on mount and provides it to child components.
 * Handles loading and error states with enhanced logging and retry mechanisms.
 * 
 * Requirements: 4.1, 4.3, 5.1, 5.2, 5.3, 5.5, 9.1, 9.5, 9.6
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
  
  // Granular loading states for each data type (Requirements: 5.5)
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    attributes: 'pending',
    closeCombatWeapons: 'pending',
    rangedWeapons: 'pending',
    equipment: 'pending',
    psychicPowers: 'pending',
    leaderTraits: 'pending',
    warbandAbilities: 'pending',
  });

  /**
   * Log API base URL during initialization (Requirements: 5.1)
   */
  const logApiInitialization = () => {
    console.log('[GameDataContext] Initializing with API base URL:', API_BASE_URL);
    console.log('[GameDataContext] Environment VITE_API_URL:', (import.meta as any).env?.VITE_API_URL || 'not set');
  };

  /**
   * Log request details (Requirements: 5.2)
   */
  const logRequest = (url: string, dataType: string) => {
    console.log(`[GameDataContext] Making API request for ${dataType}:`, url);
  };

  /**
   * Log response details (Requirements: 5.2)
   */
  const logResponse = (url: string, dataType: string, status: number, success: boolean) => {
    if (success) {
      console.log(`[GameDataContext] Successfully loaded ${dataType} from:`, url, `(Status: ${status})`);
    } else {
      console.error(`[GameDataContext] Failed to load ${dataType} from:`, url, `(Status: ${status})`);
    }
  };

  /**
   * Log state changes for debugging (Requirements: 5.5)
   */
  const logStateChange = (dataType: string, newState: string, additionalInfo?: string) => {
    const info = additionalInfo ? ` - ${additionalInfo}` : '';
    console.log(`[GameDataContext] State change: ${dataType} -> ${newState}${info}`);
  };

  /**
   * Update loading progress for a specific data type
   */
  const updateLoadingProgress = (dataType: keyof LoadingProgress, state: LoadingProgress[keyof LoadingProgress]) => {
    setLoadingProgress(prev => {
      const newProgress = { ...prev, [dataType]: state };
      logStateChange(dataType, state);
      return newProgress;
    });
  };

  /**
   * Fetch individual data type with retry mechanism (Requirements: 4.3)
   */
  const fetchDataType = async (
    url: string,
    dataType: keyof LoadingProgress,
    setter: (data: any) => void,
    maxRetries: number = 3
  ): Promise<void> => {
    updateLoadingProgress(dataType, 'loading');
    logRequest(url, dataType);

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        logResponse(url, dataType, response.status, response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch ${dataType}`);
        }

        const data = await response.json();
        setter(data);
        updateLoadingProgress(dataType, 'success');
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(`Unknown error fetching ${dataType}`);
        console.error(`[GameDataContext] Attempt ${attempt}/${maxRetries} failed for ${dataType}:`, lastError.message);
        
        if (attempt < maxRetries) {
          // Use shorter delays for testing, longer for production
          const baseDelay = process.env.NODE_ENV === 'test' ? 10 : 1000;
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 5000);
          console.log(`[GameDataContext] Retrying ${dataType} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    updateLoadingProgress(dataType, 'error');
    console.error(`[GameDataContext] All ${maxRetries} attempts failed for ${dataType}:`, lastError?.message);
    throw lastError;
  };

  /**
   * Fetch all game data from API with enhanced error handling and logging
   * Requirements: 4.1, 4.3, 5.1, 5.2, 5.3, 5.5, 9.1, 9.5
   */
  const fetchGameData = async (): Promise<void> => {
    logApiInitialization();
    setIsLoading(true);
    setError(null);
    logStateChange('GameDataContext', 'loading started');

    // Reset all loading states to pending
    setLoadingProgress({
      attributes: 'pending',
      closeCombatWeapons: 'pending',
      rangedWeapons: 'pending',
      equipment: 'pending',
      psychicPowers: 'pending',
      leaderTraits: 'pending',
      warbandAbilities: 'pending',
    });

    const fetchPromises = [
      fetchDataType(`${API_BASE_URL}/game-data/attributes`, 'attributes', setAttributes),
      fetchDataType(`${API_BASE_URL}/game-data/weapons/close`, 'closeCombatWeapons', setCloseCombatWeapons),
      fetchDataType(`${API_BASE_URL}/game-data/weapons/ranged`, 'rangedWeapons', setRangedWeapons),
      fetchDataType(`${API_BASE_URL}/game-data/equipment`, 'equipment', setEquipment),
      fetchDataType(`${API_BASE_URL}/game-data/psychic-powers`, 'psychicPowers', setPsychicPowers),
      fetchDataType(`${API_BASE_URL}/game-data/leader-traits`, 'leaderTraits', setLeaderTraits),
      fetchDataType(`${API_BASE_URL}/game-data/warband-abilities`, 'warbandAbilities', setWarbandAbilities),
    ];

    // Wait for all promises to settle (either resolve or reject)
    const results = await Promise.allSettled(fetchPromises);
    
    // Check if any promises were rejected
    const failures = results.filter(result => result.status === 'rejected') as PromiseRejectedResult[];
    
    setIsLoading(false);
    
    if (failures.length > 0) {
      // At least one request failed
      const firstError = failures[0].reason;
      const errorMessage = firstError instanceof Error ? firstError.message : 'Failed to load game data';
      setError(errorMessage);
      console.error('[GameDataContext] Error fetching game data:', firstError);
      logStateChange('GameDataContext', 'loading failed', errorMessage);
    } else {
      // All requests succeeded
      logStateChange('GameDataContext', 'loading completed successfully');
    }
  };

  /**
   * Retry only failed requests (Requirements: 4.3)
   */
  const retryFailedRequests = async (): Promise<void> => {
    console.log('[GameDataContext] Retrying failed requests...');
    const failedRequests: Promise<void>[] = [];

    // Check each data type and retry only failed ones
    if (loadingProgress.attributes === 'error') {
      failedRequests.push(fetchDataType(`${API_BASE_URL}/game-data/attributes`, 'attributes', setAttributes));
    }
    if (loadingProgress.closeCombatWeapons === 'error') {
      failedRequests.push(fetchDataType(`${API_BASE_URL}/game-data/weapons/close`, 'closeCombatWeapons', setCloseCombatWeapons));
    }
    if (loadingProgress.rangedWeapons === 'error') {
      failedRequests.push(fetchDataType(`${API_BASE_URL}/game-data/weapons/ranged`, 'rangedWeapons', setRangedWeapons));
    }
    if (loadingProgress.equipment === 'error') {
      failedRequests.push(fetchDataType(`${API_BASE_URL}/game-data/equipment`, 'equipment', setEquipment));
    }
    if (loadingProgress.psychicPowers === 'error') {
      failedRequests.push(fetchDataType(`${API_BASE_URL}/game-data/psychic-powers`, 'psychicPowers', setPsychicPowers));
    }
    if (loadingProgress.leaderTraits === 'error') {
      failedRequests.push(fetchDataType(`${API_BASE_URL}/game-data/leader-traits`, 'leaderTraits', setLeaderTraits));
    }
    if (loadingProgress.warbandAbilities === 'error') {
      failedRequests.push(fetchDataType(`${API_BASE_URL}/game-data/warband-abilities`, 'warbandAbilities', setWarbandAbilities));
    }

    if (failedRequests.length === 0) {
      console.log('[GameDataContext] No failed requests to retry');
      return;
    }

    try {
      await Promise.all(failedRequests);
      
      // Check if all requests are now successful
      const allSuccessful = Object.values(loadingProgress).every(status => status === 'success');
      if (allSuccessful) {
        setError(null);
        logStateChange('GameDataContext', 'all retries successful');
      }
    } catch (error) {
      console.error('[GameDataContext] Some retry attempts failed:', error);
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
    loadingProgress,
    refetch: fetchGameData,
    retryFailedRequests,
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
