import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Model {
  id: string;
  name: string;
  description?: string;
}

interface AppShellContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  modelSelectorDisabled: boolean;
  setModelSelectorDisabled: (disabled: boolean) => void;
  models: Model[];
  setModels: (models: Model[]) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export const AppShellProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelSelectorDisabled, setModelSelectorDisabled] = useState(false);
  const [models, setModels] = useState<Model[]>([]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <AppShellContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        selectedModel,
        setSelectedModel,
        modelSelectorDisabled,
        setModelSelectorDisabled,
        models,
        setModels,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
};

export const useAppShell = (): AppShellContextValue => {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShellProvider");
  return ctx;
};
