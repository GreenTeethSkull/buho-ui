import React, { useState } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { TextInput } from "@dynatrace/strato-components-preview/forms";
import { Text, Heading } from "@dynatrace/strato-components/typography";
import { PlusIcon, ChatIcon, DeleteIcon, CloseSidebarIcon } from "@dynatrace/strato-icons";
import { useChatTheme } from "../../hooks/useChatTheme";

export interface SidebarConversation {
  id: string;
  title: string;
  version: string;
  updatedAt: Date;
}

interface ChatSidebarProps {
  conversations: SidebarConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  searchQuery,
  onSearchChange,
  sidebarOpen = true,
  onToggleSidebar,
}) => {
  const theme = useChatTheme();
  const [isNewChatHovered, setIsNewChatHovered] = useState(false);
  const filteredConversations = conversations.filter((conv) => conv.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Flex flexDirection="column" style={{
      width: "260px",
      height: "100%",
      background: theme.sidebarBg,
      borderRight: `1px solid ${theme.sidebarBorder}`,
      display: sidebarOpen ? "flex" : "none",
    }}>
      <Flex padding={16} flexDirection="column" gap={12}>
        <Flex alignItems="center" justifyContent="space-between">
          <Heading level={5} style={{ color: theme.textPrimary, fontWeight: 600, margin: 0, fontSize: "16px" }}>Historial</Heading>
          {onToggleSidebar && (
            <Button variant="default" onClick={onToggleSidebar} onMouseEnter={(e) => e.currentTarget.style.background = theme.surfaceHover} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} style={{ background: "transparent", border: "none", padding: "4px", minHeight: "auto" }}>
              <CloseSidebarIcon style={{ width: "16px", height: "16px", color: theme.textTertiary }} />
            </Button>
          )}
        </Flex>
        
        <Button onClick={onNewChat} variant="emphasized" onMouseEnter={() => setIsNewChatHovered(true)} onMouseLeave={() => setIsNewChatHovered(false)} style={{ 
          width: "100%", 
          background: isNewChatHovered ? theme.accentLight : theme.accent, 
          border: "none",
          borderRadius: "8px",
          padding: "10px 16px",
          fontSize: "14px",
          fontWeight: 500,
          transition: "background 0.2s ease",
        }}>
          <Button.Prefix><PlusIcon style={{ width: "16px", height: "16px" }} /></Button.Prefix>
          Nuevo Chat
        </Button>
        
        <TextInput 
          placeholder="Buscar conversaciones..." 
          value={searchQuery} 
          onChange={onSearchChange} 
          style={{ 
            background: theme.inputBg, 
            border: `1px solid ${theme.inputBorder}`, 
            borderRadius: "8px",
            fontSize: "13px",
          }} 
        />
      </Flex>

      <Flex flexDirection="column" gap={2} style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        <Text style={{ 
          color: theme.textTertiary, 
          fontSize: "11px", 
          fontWeight: 500, 
          padding: "8px 8px 4px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Recientes
        </Text>
        
        {filteredConversations.length === 0 ? (
          <Flex justifyContent="center" alignItems="center" padding={24}>
            <Text style={{ color: theme.textTertiary, fontSize: "13px" }}>Sin conversaciones</Text>
          </Flex>
        ) : (
          filteredConversations.map((conversation) => (
            <Flex key={conversation.id} alignItems="center" justifyContent="space-between" padding={8}
              style={{
                cursor: "pointer", 
                borderRadius: "8px",
                background: activeConversationId === conversation.id ? theme.accentBg : "transparent",
                transition: "all 0.15s ease",
              }}
              onClick={() => onSelectConversation(conversation.id)}
              onMouseEnter={(e) => { if (activeConversationId !== conversation.id) { e.currentTarget.style.background = theme.surfaceHover; } }}
              onMouseLeave={(e) => { if (activeConversationId !== conversation.id) { e.currentTarget.style.background = "transparent"; } }}
            >
              <Flex alignItems="center" gap={8} style={{ flex: 1, overflow: "hidden" }}>
                <ChatIcon style={{ color: activeConversationId === conversation.id ? theme.accent : theme.textTertiary, flexShrink: 0, width: "16px", height: "16px" }} />
                <Text style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: activeConversationId === conversation.id ? theme.textPrimary : theme.textSecondary, fontSize: "13px" }}>
                  {conversation.title}
                </Text>
              </Flex>
              <Button variant="default" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteConversation(conversation.id); }} style={{ opacity: 0.5, background: "transparent", border: "none", padding: "4px", minHeight: "auto" }}>
                <DeleteIcon style={{ width: "14px", height: "14px" }} />
              </Button>
            </Flex>
          ))
        )}
      </Flex>


    </Flex>
  );
};
