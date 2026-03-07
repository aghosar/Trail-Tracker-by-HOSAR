
import { createContext, useContext, useState, ReactNode } from "react";

interface WidgetContextType {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export function useWidgetContext() {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidgetContext must be used within WidgetProvider");
  }
  return context;
}

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <WidgetContext.Provider value={{ isEditMode, setIsEditMode }}>
      {children}
    </WidgetContext.Provider>
  );
}
