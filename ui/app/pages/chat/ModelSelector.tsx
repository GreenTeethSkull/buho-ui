import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Select, SelectOption, SelectContent, SelectTrigger } from "@dynatrace/strato-components-preview/forms";
import { Text } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import type { Model } from "../../domain/conversation";

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onModelChange, disabled = true }) => {
  return (
    <Flex alignItems="center" gap={8}>
      <Text style={{ color: Colors.Text.Neutral.Subdued, fontSize: "13px", fontWeight: 500 }}>Agent:</Text>
      <Select value={selectedModel} onChange={(v) => onModelChange(v as string)} disabled={disabled}>
        <SelectTrigger style={{ minWidth: "140px", background: disabled ? Colors.Background.Surface.Default : Colors.Background.Container.Neutral.Emphasized, border: `1px solid ${Colors.Border.Neutral.Default}`, borderRadius: "6px", color: Colors.Text.Neutral.Default, fontSize: "13px" }} />
        <SelectContent style={{ background: Colors.Background.Container.Neutral.Emphasized, border: `1px solid ${Colors.Border.Neutral.Default}`, borderRadius: "8px" }}>
          {models.map((model) => (
            <SelectOption key={model.id} value={model.id} style={{ color: Colors.Text.Neutral.Subdued, borderRadius: "6px" }}>
              <Flex flexDirection="column" gap={2} padding={4}>
                <Text style={{ fontWeight: 600, color: Colors.Text.Neutral.Default, fontSize: "13px" }}>{model.name}</Text>
                <Text style={{ fontSize: "11px", color: Colors.Text.Neutral.Subdued }}>{model.description}</Text>
              </Flex>
            </SelectOption>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
};
