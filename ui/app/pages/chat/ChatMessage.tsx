import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text, Paragraph } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import Borders from "@dynatrace/strato-design-tokens/borders";
import { UserSessionsIcon, DavisAIIcon } from "@dynatrace/strato-icons";
import type { ConversationMessage } from "../../domain/conversation";

interface ChatMessageProps {
  message: ConversationMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const markdownComponents: Components = {
    p: ({ children }) => (
      <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>{children}</Paragraph>
    ),
    ul: ({ children }) => (
      <ul style={{ margin: "4px 0", paddingLeft: 20 }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ margin: "4px 0", paddingLeft: 20 }}>{children}</ol>
    ),
    li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
    table: ({ children }) => (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th
        style={{
          textAlign: "left",
          padding: "6px 8px",
          borderBottom: `1px solid ${Colors.Border.Neutral.Default}`,
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{
          padding: "6px 8px",
          borderBottom: `1px solid ${Colors.Border.Neutral.Default}`,
        }}
      >
        {children}
      </td>
    ),
  };

  return (
    <Flex
      flexDirection="column"
      padding={16}
      style={{
        background: isUser ? "transparent" : Colors.Background.Container.Neutral.Default,
        borderRadius: Borders.Radius.Container.Default,
      }}
    >
      <Flex alignItems="flex-start" gap={12}>
        <Flex
          alignItems="center"
          justifyContent="center"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: isUser
              ? Colors.Background.Container.Primary.Emphasized
              : Colors.Background.Container.Neutral.Emphasized,
            flexShrink: 0,
          }}
        >
          {isUser ? (
            <UserSessionsIcon style={{ color: Colors.Text.Primary.Default }} />
          ) : (
            <DavisAIIcon style={{ color: Colors.Text.Neutral.Default }} />
          )}
        </Flex>
        <Flex flexDirection="column" gap={4} style={{ flex: 1 }}>
          <Text style={{ fontWeight: 600 }}>{isUser ? "You" : "Assistant"}</Text>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </Flex>
      </Flex>
    </Flex>
  );
};
