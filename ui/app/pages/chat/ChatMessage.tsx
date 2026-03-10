import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Paragraph } from "@dynatrace/strato-components/typography";
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon, CheckmarkIcon } from "@dynatrace/strato-icons";
import { useChatTheme } from "../../hooks/useChatTheme";
import type { ConversationMessage } from "../../domain/conversation";

interface ChatMessageProps {
  message: ConversationMessage;
}

interface ActionButtonProps {
  onClick: () => void;
  tooltip: string;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, tooltip, active = false, activeColor, children }) => {
  const theme = useChatTheme();
  const [hovered, setIsHovered] = useState(false);
  const color = active && activeColor ? activeColor : active ? theme.accent : hovered ? theme.textSecondary : theme.textTertiary;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: hovered ? theme.surfaceHover : "transparent",
          border: "none",
          padding: "4px 6px",
          cursor: "pointer",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          transition: "all 0.15s ease",
        }}
      >
        {children}
      </button>
      {hovered && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 4px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: "4px",
          padding: "3px 8px",
          fontSize: "11px",
          color: theme.textSecondary,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
};

const formatTimestamp = (timestamp: string | number | Date): string => {
  const msgDate = new Date(timestamp);
  const now = new Date();
  const isToday = msgDate.toDateString() === now.toDateString();
  const time = msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  const day = msgDate.getDate().toString().padStart(2, "0");
  const month = (msgDate.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${time}`;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const theme = useChatTheme();
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const markdownComponents: Components = useMemo(() => ({
    p: ({ children }) => (
      <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap", color: theme.textPrimary, lineHeight: "1.7", fontSize: "15px" }}>
        {children}
      </Paragraph>
    ),
    ul: ({ children }) => <ul style={{ margin: "12px 0", paddingLeft: "20px", color: theme.textPrimary, lineHeight: "1.7", fontSize: "15px" }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: "12px 0", paddingLeft: "20px", color: theme.textPrimary, lineHeight: "1.7", fontSize: "15px" }}>{children}</ol>,
    li: ({ children }) => <li style={{ marginBottom: "6px" }}>{children}</li>,
    table: ({ children }) => (
      <div style={{ overflowX: "auto", margin: "16px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", border: `1px solid ${theme.border}` }}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead style={{ background: theme.surfaceHover }}>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr style={{ borderBottom: `1px solid ${theme.border}` }}>{children}</tr>,
    th: ({ children }) => <th style={{ textAlign: "left", padding: "10px 12px", color: theme.textPrimary, fontWeight: 600, fontSize: "12px" }}>{children}</th>,
    td: ({ children }) => <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: "13px" }}>{children}</td>,
    h1: ({ children }) => <h1 style={{ fontSize: "22px", fontWeight: 600, margin: "20px 0 12px", color: theme.textPrimary }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "16px 0 10px", color: theme.textPrimary }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "12px 0 8px", color: theme.textPrimary }}>{children}</h3>,
    code: ({ children, className }) => {
      const isInline = !className;
      if (isInline) return <code style={{ background: theme.surfaceHover, padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", fontSize: "13px", color: theme.accent }}>{children}</code>;
      return <code style={{ background: theme.surfaceHover, padding: "14px", borderRadius: "6px", fontFamily: "monospace", fontSize: "13px", color: theme.accentLight, display: "block", overflowX: "auto", margin: "12px 0", border: `1px solid ${theme.border}` }}>{children}</code>;
    },
    pre: ({ children }) => <pre style={{ background: theme.surfaceHover, padding: "14px", borderRadius: "6px", overflowX: "auto", margin: "12px 0", border: `1px solid ${theme.border}` }}>{children}</pre>,
    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, textDecoration: "underline" }}>{children}</a>,
    blockquote: ({ children }) => <blockquote style={{ borderLeft: `3px solid ${theme.accent}`, paddingLeft: "14px", margin: "12px 0", color: theme.textTertiary, fontStyle: "italic" }}>{children}</blockquote>,
    hr: () => <hr style={{ border: "none", height: "1px", background: theme.messageSeparator, margin: "20px 0" }} />,
    strong: ({ children }) => <strong style={{ color: theme.textPrimary, fontWeight: 600 }}>{children}</strong>,
    em: ({ children }) => <em style={{ color: theme.textTertiary }}>{children}</em>,
  }), [theme]);

  const formattedTime = formatTimestamp(message.timestamp);

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLike = (like: boolean) => {
    setLiked(liked === like ? null : like);
  };

  if (isUser) {
    return (
      <Flex flexDirection="column" alignItems="flex-end" style={{ padding: "8px 20px", background: theme.chatBg }}>
        <Flex style={{
          maxWidth: "70%",
          background: theme.accentBg,
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: "16px",
          borderBottomRightRadius: "4px",
          padding: "12px 16px",
        }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </Flex>
        <Flex alignItems="center" gap={4} style={{ marginTop: "4px" }}>
          <ActionButton onClick={handleCopy} tooltip="Copiar">
            {copied
              ? <CheckmarkIcon style={{ width: "13px", height: "13px", color: theme.success }} />
              : <CopyIcon style={{ width: "13px", height: "13px" }} />
            }
          </ActionButton>
          <span style={{ fontSize: "10px", color: theme.textTertiary }}>{formattedTime}</span>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" style={{ padding: "12px 20px", background: theme.chatBg }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {message.content}
      </ReactMarkdown>

      <Flex alignItems="center" justifyContent="space-between" style={{ marginTop: "8px" }}>
        <Flex alignItems="center" gap={2}>
          <span style={{ fontSize: "10px", color: theme.textTertiary, marginRight: "6px" }}>{formattedTime}</span>
          <ActionButton onClick={handleCopy} tooltip="Copiar">
            {copied
              ? <CheckmarkIcon style={{ width: "14px", height: "14px", color: theme.success }} />
              : <CopyIcon style={{ width: "14px", height: "14px" }} />
            }
          </ActionButton>
          <ActionButton
            onClick={() => handleLike(true)}
            tooltip="Buena respuesta"
            active={liked === true}
            activeColor={theme.success}
          >
            <ThumbsUpIcon style={{ width: "14px", height: "14px" }} />
          </ActionButton>
          <ActionButton
            onClick={() => handleLike(false)}
            tooltip="Mala respuesta"
            active={liked === false}
            activeColor="#f85149"
          >
            <ThumbsDownIcon style={{ width: "14px", height: "14px" }} />
          </ActionButton>
        </Flex>
      </Flex>
    </Flex>
  );
};