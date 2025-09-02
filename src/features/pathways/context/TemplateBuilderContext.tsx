"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface TemplateBuilderContextType {
  canModifyTemplate: boolean;
  refreshTemplateData: () => void; // Function to trigger a full re-fetch of template and phases
  onCancelPhaseForm: () => void; // Centralized cancel action for phase forms
}

const TemplateBuilderContext = createContext<TemplateBuilderContextType | undefined>(undefined);

export const TemplateBuilderContextProvider = ({
  children,
  canModifyTemplate,
  refreshTemplateData,
  onCancelPhaseForm,
}: {
  children: ReactNode;
  canModifyTemplate: boolean;
  refreshTemplateData: () => void;
  onCancelPhaseForm: () => void;
}) => {
  return (
    <TemplateBuilderContext.Provider
      value={{
        canModifyTemplate,
        refreshTemplateData,
        onCancelPhaseForm,
      }}
    >
      {children}
    </TemplateBuilderContext.Provider>
  );
};

export const useTemplateBuilder = () => {
  const context = useContext(TemplateBuilderContext);
  if (context === undefined) {
    throw new Error("useTemplateBuilder must be used within a TemplateBuilderContextProvider");
  }
  return context;
};