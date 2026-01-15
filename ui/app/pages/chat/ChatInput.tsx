import React, { useState } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { TextArea } from "@dynatrace/strato-components-preview/forms";
import Colors from "@dynatrace/strato-design-tokens/colors";
import Borders from "@dynatrace/strato-design-tokens/borders";
import BoxShadows from "@dynatrace/strato-design-tokens/box-shadows";
import { ArrowRightIcon, UploadIcon } from "@dynatrace/strato-icons";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Escribe un mensaje..."
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex
      flexDirection="column"
      padding={16}
      style={{
        background: Colors.Background.Surface.Default,
        borderTop: `1px solid ${Colors.Border.Neutral.Default}`,
      }}
    >
      <Flex
        alignItems="flex-end"
        gap={8}
        style={{
          background: Colors.Background.Field.Neutral.Default,
          borderRadius: Borders.Radius.Container.Default,
          boxShadow: BoxShadows.Surface.Raised.Rest,
          padding: "8px 12px",
        }}
      >
        <Button variant="default" disabled={disabled}>
          <UploadIcon />
        </Button>
        <Flex style={{ flex: 1 }}>
          <TextArea
            value={message}
            onChange={setMessage}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              resize: "none",
              minHeight: "24px",
              maxHeight: "200px",
              border: "none",
              background: "transparent",
              width: "100%",
            }}
          />
        </Flex>
        <Button
          variant="emphasized"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
        >
          <ArrowRightIcon />
        </Button>
      </Flex>
    </Flex>
  );
};
