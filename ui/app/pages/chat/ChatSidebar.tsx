import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { TextInput } from "@dynatrace/strato-components-preview/forms";
import { Text } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import Borders from "@dynatrace/strato-design-tokens/borders";
import { PlusIcon, ChatIcon, DeleteIcon } from "@dynatrace/strato-icons";
import { Conversation } from "./types";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  searchQuery,
  onSearchChange,
}) => {
  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Flex
      flexDirection="column"
      style={{
        width: "260px",
        height: "100%",
        background: Colors.Background.Surface.Default,
        borderRight: `1px solid ${Colors.Border.Neutral.Default}`,
      }}
    >
      <Flex padding={12} flexDirection="column" gap={8}>
        <Button onClick={onNewChat} variant="emphasized" style={{ width: "100%" }}>
          <Button.Prefix>
            <PlusIcon />
          </Button.Prefix>
          New Chat
        </Button>
        <TextInput
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={onSearchChange}
        />
      </Flex>

      <Flex
        flexDirection="column"
        gap={4}
        padding={8}
        style={{ flex: 1, overflowY: "auto" }}
      >
        {filteredConversations.length === 0 ? (
          <Flex
            justifyContent="center"
            alignItems="center"
            padding={16}
            style={{ color: Colors.Text.Neutral.Subdued }}
          >
            <Text>No conversations yet</Text>
          </Flex>
        ) : (
          filteredConversations.map((conversation) => (
            <Flex
              key={conversation.id}
              alignItems="center"
              justifyContent="space-between"
              padding={12}
              style={{
                cursor: "pointer",
                borderRadius: Borders.Radius.Field.Default,
                background:
                  activeConversationId === conversation.id
                    ? Colors.Background.Field.Neutral.Emphasized
                    : "transparent",
              }}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <Flex alignItems="center" gap={8} style={{ flex: 1, overflow: "hidden" }}>
                <ChatIcon />
                <Text
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {conversation.title}
                </Text>
              </Flex>
              <Button
                variant="default"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
              >
                <DeleteIcon />
              </Button>
            </Flex>
          ))
        )}
      </Flex>
    </Flex>
  );
};
