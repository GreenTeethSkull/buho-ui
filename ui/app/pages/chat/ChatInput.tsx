import React, { useState, useRef, useEffect } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { ArrowRightIcon } from "@dynatrace/strato-icons";
import { useChatTheme } from "../../hooks/useChatTheme";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MIN_HEIGHT = 38;
const MAX_HEIGHT = 76;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const theme = useChatTheme();
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = `${MIN_HEIGHT}px`;
    if (message.length > 0) {
      const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT);
      if (newHeight > MIN_HEIGHT) {
        el.style.height = `${newHeight}px`;
      }
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = `${MIN_HEIGHT}px`;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !!message.trim() && !disabled;

  return (
    <Flex flexDirection="column" padding={12} style={{ background: theme.inputAreaBg, borderTop: `1px solid ${theme.inputAreaBorder}` }}>
      <Flex alignItems="flex-end" gap={8}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Escribe un mensaje..."
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: theme.inputBg,
            border: `1px solid ${isFocused ? theme.inputFocusBorder : theme.inputBorder}`,
            borderRadius: "24px",
            padding: "8px 18px",
            color: theme.textPrimary,
            fontSize: "14px",
            lineHeight: "22px",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            height: `${MIN_HEIGHT}px`,
            minHeight: `${MIN_HEIGHT}px`,
            maxHeight: `${MAX_HEIGHT}px`,
            resize: "none",
            overflowY: "auto",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            boxShadow: isFocused ? `0 0 0 3px ${theme.accentBg}` : "none",
            display: "block",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Enviar"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            background: canSend
              ? isHovered ? theme.buttonPrimaryHover : theme.buttonPrimaryBg
              : theme.surfaceHover,
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            minWidth: "36px",
            flexShrink: 0,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.5,
            color: canSend ? theme.buttonPrimaryText : theme.textTertiary,
            fontFamily: "inherit",
          }}
        >
          <ArrowRightIcon style={{ width: "16px", height: "16px" }} />
        </button>
      </Flex>
    </Flex>
  );
};