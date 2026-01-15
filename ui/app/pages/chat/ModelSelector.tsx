import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Select, SelectOption, SelectContent, SelectTrigger } from "@dynatrace/strato-components-preview/forms";
import { Text } from "@dynatrace/strato-components/typography";
import { Model } from "./types";

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  disabled = true,
}) => {
  return (
    <Flex alignItems="center" gap={8}>
      <Text>Agente:</Text>
      <Select
        value={selectedModel}
        onChange={(value) => onModelChange(value as string)}
        disabled={disabled}
      >
        <SelectTrigger style={{ minWidth: "200px" }} />
        <SelectContent>
          {models.map((model) => (
            <SelectOption key={model

.id} value={model.id}>
              {model.name}
            </SelectOption>
          ))}
        </SelectContent>
      </Select>
    </Flex>
  );
};