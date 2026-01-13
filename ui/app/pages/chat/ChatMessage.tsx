import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text, Paragraph } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import Borders from "@dynatrace/strato-design-tokens/borders";
import { UserSessionsIcon, DavisAIIcon } from "@dynatrace/strato-icons";
import { Message } from "./types";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

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
          <Paragraph style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {message.content}
          </Paragraph>
        </Flex>
      </Flex>
    </Flex>
  );
};
