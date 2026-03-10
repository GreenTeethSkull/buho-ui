import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Select, SelectOption, SelectContent, SelectTrigger } from "@dynatrace/strato-components-preview/forms";
import { Text } from "@dynatrace/strato-components/typography";
import { useChatTheme } from "../../hooks/useChatTheme";
import type { Model } from "../../domain/conversation";

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onModelChange, disabled = true }) => {
  const theme = useChatTheme();
  return (
    <Flex alignItems="center" gap={8}>
      <Text style={{ color: theme.textTertiary, fontSize: "13px", fontWeight: 500 }}>Agent:</Text>
      <Select value={selectedModel} onChange={(v) => onModelChange(v as string)} disabled={disabled}>
        <SelectTrigger style={{ minWidth: "140px", background: disabled ? theme.inputBg : theme.surface, border: `1px solid ${theme.inputBorder}`, borderRadius: "6px", color: theme.textPrimary, fontSize: "13px" }} />
        <SelectContent style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
          {models.map((model) => (
            <SelectOption key={model.id} value={model.id} style={{ color: theme.textSecondary, borderRadius: "6px" }}>
              <Flex flexDirection="column" gap={2} padding={4}>
                <Text style={{ fontWeight: 600, color: theme.textPrimary, fontSize: "13px" }}>{model.name}</Text>
                <Text style={{ fontSize: "11px", color: theme.textTertiary }}>{model.description}</Text>
              </Flex>
            </SelectOption>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
};
