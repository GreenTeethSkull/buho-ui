import React, { useState } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { ArrowRightIcon } from "@dynatrace/strato-icons";
import { useChatTheme } from "../../hooks/useChatTheme";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const theme = useChatTheme();
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSend = () => { if (message.trim() && !disabled) { onSendMessage(message.trim()); setMessage(""); } };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const canSend = message.trim() && !disabled;

  return (
    <Flex flexDirection="column" padding={12} style={{ background: theme.inputAreaBg, borderTop: `1px solid ${theme.inputAreaBorder}` }}>
      <Flex alignItems="center" gap={8}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Escribe un mensaje..."
          disabled={disabled}
          style={{
            flex: 1,
            background: theme.inputBg,
            border: `1px solid ${isFocused ? theme.inputFocusBorder : theme.inputBorder}`,
            borderRadius: "24px",
            padding: "12px 18px",
            color: theme.textPrimary,
            fontSize: "14px",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            boxShadow: isFocused ? `0 0 0 3px ${theme.accentBg}` : "none",
          }}
        />
        <Button
          variant="emphasized"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Enviar"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: canSend ? (isHovered ? theme.accentLight : theme.accent) : theme.surfaceHover,
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            minWidth: "40px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.6,
          }}
        >
          <ArrowRightIcon style={{ width: "18px", height: "18px" }} />
        </Button>
      </Flex>
    </Flex>
  );
};
