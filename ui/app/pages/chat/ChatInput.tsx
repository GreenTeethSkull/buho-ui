import React, { useState } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { Select, SelectOption, SelectContent, SelectTrigger } from "@dynatrace/strato-components-preview/forms";
import { ArrowRightIcon, ChevronDownIcon } from "@dynatrace/strato-icons";
import { useChatTheme } from "../../hooks/useChatTheme";
import type { Model } from "../../domain/conversation";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  models?: Model[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  modelDisabled?: boolean;
  messageCount?: number;
  isConnected?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  models = [],
  selectedModel = "",
  onModelChange,
  modelDisabled = false,
  messageCount = 0,
  isConnected = false,
}) => {
  const theme = useChatTheme();
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => { if (message.trim() && !disabled) { onSendMessage(message.trim()); setMessage(""); } };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const canSend = message.trim() && !disabled;
  const selectedModelName = models.find(m => m.id === selectedModel)?.name || "Select";

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
          placeholder="Enter to send · Shift + Enter for new line"
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
          aria-label="Send"
          style={{
            background: canSend ? theme.accent : theme.surfaceHover,
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
          }}
        >
          <ArrowRightIcon style={{ width: "18px", height: "18px" }} />
        </Button>
      </Flex>
      
      <Flex alignItems="center" justifyContent="space-between" style={{ marginTop: "8px" }}>
        <Flex alignItems="center" gap={8}>
          {models.length > 0 && onModelChange && (
            <Select value={selectedModel} onChange={(v) => onModelChange?.(v as string)} disabled={modelDisabled}>
              <SelectTrigger style={{ height: "22px", minWidth: "80px", background: "transparent", border: "none", padding: "0 4px", fontSize: "11px", color: theme.textTertiary }}>
                <Flex alignItems="center" gap={4}>
                  <span>{selectedModelName}</span>
                  <ChevronDownIcon style={{ width: "12px", height: "12px" }} />
                </Flex>
              </SelectTrigger>
              <SelectContent style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "8px" }}>
                {models.map((model) => (
                  <SelectOption key={model.id} value={model.id} style={{ color: theme.textSecondary, fontSize: "12px", padding: "8px 12px" }}>
                    {model.name}
                  </SelectOption>
                ))}
              </SelectContent>
            </Select>
          )}
        </Flex>
        <Flex alignItems="center" gap={8}>
          {isConnected && (
            <Flex alignItems="center" gap={4}>
              <Flex style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme.success }} />
              <span style={{ color: theme.success, fontSize: "10px" }}>Connected</span>
            </Flex>
          )}
          <span style={{ color: theme.textTertiary, fontSize: "10px" }}>{messageCount} msg{messageCount !== 1 ? "s" : ""}</span>
        </Flex>
      </Flex>
    </Flex>
  );
};
