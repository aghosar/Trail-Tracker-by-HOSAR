
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
}

interface ActiveTrip {
  id: string;
  activityType: string;
  startTime: string;
  status: string;
  lastLatitude: number;
  lastLongitude: number;
  emergencyContact: {
    name: string;
    phoneNumber: string;
  };
  clothingDescription: string;
  vehicleDescription: string;
}

interface TripContextType {
  activeTrip: ActiveTrip | null;
  elapsedTime: number;
  setActiveTrip: (trip: ActiveTrip | null) => void;
  emergencyContacts: EmergencyContact[];
  setEmergencyContacts: (contacts: EmergencyContact[]) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within TripProvider');
  }
  return context;
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect that persists across navigation
  useEffect(() => {
    console.log('[TripContext] Timer effect triggered. Active trip:', !!activeTrip);
    
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (activeTrip) {
      console.log('[TripContext] Starting persistent timer for trip:', activeTrip.id);
      const startTime = new Date(activeTrip.startTime).getTime();
      
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
      };
      
      // Update immediately
      updateTimer();
      
      // Update every second
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        console.log('[TripContext] Cleaning up timer interval');
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    } else {
      console.log('[TripContext] No active trip, timer not started');
      setElapsedTime(0);
    }
  }, [activeTrip?.startTime]);

  return (
    <TripContext.Provider
      value={{
        activeTrip,
        elapsedTime,
        setActiveTrip,
        emergencyContacts,
        setEmergencyContacts,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}
