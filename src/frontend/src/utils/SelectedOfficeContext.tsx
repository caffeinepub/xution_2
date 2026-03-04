import { type ReactNode, createContext, useContext, useState } from "react";

interface SelectedOfficeContextValue {
  selectedOfficeId: string | null;
  setSelectedOfficeId: (id: string | null) => void;
}

const SelectedOfficeContext = createContext<SelectedOfficeContextValue>({
  selectedOfficeId: null,
  setSelectedOfficeId: () => {},
});

export function SelectedOfficeProvider({ children }: { children: ReactNode }) {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  return (
    <SelectedOfficeContext.Provider
      value={{ selectedOfficeId, setSelectedOfficeId }}
    >
      {children}
    </SelectedOfficeContext.Provider>
  );
}

export function useSelectedOffice() {
  return useContext(SelectedOfficeContext);
}
