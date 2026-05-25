import React, { useState, useRef, useEffect } from "react";
import { ArrowUpIcon } from "@dynatrace/strato-icons";
import Colors from "@dynatrace/strato-design-tokens/colors";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MIN_HEIGHT = 52;
const MAX_HEIGHT = 200;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevDisabledRef = useRef(disabled);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "TEXTAREA" && tag !== "INPUT" && tag !== "SELECT") {
          e.preventDefault();
          textareaRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (prevDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }
    prevDisabledRef.current = disabled;
  }, [disabled]);

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
        textareaRef.current.focus();
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
    <div style={{
      padding: "8px 16px 12px",
      background: Colors.Background.Base.Default,
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        background: Colors.Background.Surface.Default,
        borderRadius: "12px",
        border: `1px solid ${isFocused ? Colors.Border.Primary.Accent : Colors.Border.Neutral.Default}`,
        boxShadow: isFocused
          ? `0 0 0 2px ${Colors.Border.Primary.Accent}25`
          : "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        padding: "10px 12px",
      }}>
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
            background: "transparent",
            border: "none",
            padding: "2px 0",
            color: Colors.Text.Neutral.Default,
            fontSize: "14px",
            lineHeight: "22px",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            height: `${MIN_HEIGHT}px`,
            minHeight: `${MIN_HEIGHT}px`,
            maxHeight: `${MAX_HEIGHT}px`,
            resize: "none",
            overflowY: "hidden",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Enviar"
          style={{
            background: canSend ? Colors.Theme.Primary['60'] : Colors.Background.Container.Neutral.Default,
            border: "none",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            minWidth: "32px",
            flexShrink: 0,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.35,
            color: canSend ? "#ffffff" : Colors.Text.Neutral.Subdued,
            fontFamily: "inherit",
            marginBottom: "1px",
            lineHeight: 0,
          }}
        >
          <ArrowUpIcon style={{ width: "16px", height: "16px" }} />
        </button>
      </div>
    </div>
  );
};