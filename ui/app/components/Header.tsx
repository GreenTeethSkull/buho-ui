import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@dynatrace/strato-components-preview/layouts";
import { Select, SelectOption, SelectContent, SelectTrigger } from "@dynatrace/strato-components-preview/forms";
import { Flex } from "@dynatrace/strato-components/layouts";
import { MenuIcon } from "@dynatrace/strato-icons";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { useAppShell } from "../hooks/useAppShell";

export const Header = () => {
  const {
    sidebarOpen,
    toggleSidebar,
    selectedModel,
    setSelectedModel,
    modelSelectorDisabled,
    models,
  } = useAppShell();

  const [isSelectorHovered, setIsSelectorHovered] = useState(false);

  return (
    <AppHeader>
      <AppHeader.Navigation>
        <AppHeader.NavigationItem onClick={toggleSidebar} style={{ padding: "2px 6px", display: "flex", alignItems: "center" }}>
          <MenuIcon style={{ width: "22px", height: "22px" }} />
        </AppHeader.NavigationItem>
        <AppHeader.Logo as={Link} to="/" />
      </AppHeader.Navigation>
      <AppHeader.ActionItems>
        <Flex alignItems="center" gap={4}>
          {models.length > 0 && (
            <div
              onMouseEnter={() => setIsSelectorHovered(true)}
              onMouseLeave={() => setIsSelectorHovered(false)}
              style={{
                opacity: modelSelectorDisabled ? 0.5 : 1,
                cursor: modelSelectorDisabled ? "not-allowed" : "default",
                transition: "opacity 0.2s ease",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Select
                value={selectedModel}
                onChange={(v) => !modelSelectorDisabled && setSelectedModel(v as string)}
                disabled={modelSelectorDisabled}
                style={{ pointerEvents: modelSelectorDisabled ? "none" : "auto" }}
              >
                <SelectTrigger style={{
                  minWidth: "90px",
                  height: "28px",
                  background: isSelectorHovered ? Colors.Background.Container.Neutral.Default : "transparent",
                  border: `1px solid ${isSelectorHovered ? Colors.Border.Neutral.Accent : "transparent"}`,
                  borderRadius: "4px",
                  color: Colors.Text.Neutral.Default,
                  fontSize: "13px",
                  padding: "0 8px",
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }} />
                <SelectContent style={{
                  background: Colors.Background.Container.Neutral.Emphasized,
                  border: `1px solid ${Colors.Border.Neutral.Default}`,
                  borderRadius: "6px",
                }}>
                  {models.map((model) => (
                    <SelectOption
                      key={model.id}
                      value={model.id}
                      style={{
                        color: Colors.Text.Neutral.Default,
                        borderRadius: "4px",
                        padding: "6px 10px",
                        fontSize: "13px",
                      }}
                    >
                      {model.name}
                    </SelectOption>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Flex>
      </AppHeader.ActionItems>
    </AppHeader>
  );
};