import React, { useState, useMemo } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { Text } from "@dynatrace/strato-components/typography";
import { PlusIcon, ChatIcon, DeleteIcon, ResearchIcon, ShareIcon } from "@dynatrace/strato-icons";
import Colors from "@dynatrace/strato-design-tokens/colors";

export interface SidebarConversation {
  id: string;
  title: string;
  version: string;
  updatedAt: Date;
  isShared?: boolean;
  isSharedWithCurrentUser?: boolean;
}

interface ChatSidebarProps {
  conversations: SidebarConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onShare: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sidebarOpen?: boolean;
}

const getDateGroup = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays <= 7) return "Últimos 7 días";
  return "Anterior";
};

interface GroupedConversations {
  [key: string]: SidebarConversation[];
}

const GROUP_ORDER = ["Hoy", "Últimos 7 días", "Anterior"];

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onShare,
  searchQuery,
  onSearchChange,
  sidebarOpen = true,
}) => {
  const [isNewChatHovered, setIsNewChatHovered] = useState(false);

  const filteredConversations = useMemo(
    () => conversations.filter((conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  );

  const grouped = useMemo(() => {
    const groups: GroupedConversations = {};
    for (const conv of filteredConversations) {
      const group = getDateGroup(conv.updatedAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(conv);
    }
    return groups;
  }, [filteredConversations]);

  return (
    <Flex flexDirection="column" style={{
      width: "260px",
      height: "100%",
      background: Colors.Background.Base.Default,
      borderRight: `1px solid ${Colors.Border.Neutral.Default}`,
      display: sidebarOpen ? "flex" : "none",
    }}>
      <Flex padding={16} flexDirection="column" gap={12}>
        <button
          onClick={onNewChat}
          onMouseEnter={() => setIsNewChatHovered(true)}
          onMouseLeave={() => setIsNewChatHovered(false)}
          style={{
            width: "100%",
            background: isNewChatHovered ? Colors.Theme.Primary['80'] : Colors.Theme.Primary['70'],
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontFamily: "inherit",
            boxShadow: isNewChatHovered ? `0 2px 8px ${Colors.Theme.Primary['70']}50` : "none",
          }}
        >
          <PlusIcon style={{ width: "16px", height: "16px" }} />
          Nuevo Chat
        </button>

        <div style={{ position: "relative" }}>
          <ResearchIcon style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "14px",
            height: "14px",
            color: Colors.Text.Neutral.Subdued,
            pointerEvents: "none",
            zIndex: 1,
          }} />
          <input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              background: Colors.Background.Container.Neutral.Subdued,
              border: `1px solid transparent`,
              borderRadius: "8px",
              padding: "8px 10px 8px 32px",
              color: Colors.Text.Neutral.Default,
              fontSize: "13px",
              outline: "none",
              fontFamily: "inherit",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = Colors.Border.Neutral.Accent;
              e.currentTarget.style.background = Colors.Background.Surface.Default;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = Colors.Background.Container.Neutral.Subdued;
            }}
          />
        </div>
      </Flex>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
        {filteredConversations.length === 0 ? (
          <Flex justifyContent="center" alignItems="center" padding={32}>
            <Text style={{ color: Colors.Text.Neutral.Subdued, fontSize: "13px" }}>
              {searchQuery ? "Sin resultados" : "Sin conversaciones"}
            </Text>
          </Flex>
        ) : (
          GROUP_ORDER.map((groupName) => {
            const groupConvs = grouped[groupName];
            if (!groupConvs || groupConvs.length === 0) return null;
            return (
              <div key={groupName} style={{ marginBottom: "8px" }}>
                <Text style={{
                  color: Colors.Text.Neutral.Subdued,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "8px 8px 6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  display: "block",
                }}>
                  {groupName}
                </Text>
                {groupConvs.map((conversation) => (
                  <SidebarItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    onShare={onShare}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>
    </Flex>
  );
};

interface SidebarItemProps {
  conversation: SidebarConversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ conversation, isActive, onSelect, onDelete, onShare }) => {
  const [hovered, setHovered] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const isReceived = conversation.isSharedWithCurrentUser === true;

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => { setHovered(true); }}
      onMouseLeave={() => { setHovered(false); setShowDelete(false); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        cursor: "pointer",
        borderRadius: "8px",
        background: isActive ? Colors.Background.Container.Primary.Default : hovered ? Colors.Background.Container.Neutral.Default : "transparent",
        transition: "all 0.15s ease",
        marginBottom: "2px",
      }}
    >
      <ChatIcon style={{
        color: isActive ? Colors.Text.Primary.Default : Colors.Text.Neutral.Subdued,
        flexShrink: 0,
        width: "16px",
        height: "16px",
        transition: "color 0.15s ease",
      }} />
      <Text style={{
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        color: isActive ? Colors.Text.Neutral.Default : Colors.Text.Neutral.Subdued,
        fontSize: "13px",
        transition: "color 0.15s ease",
      }}>
        {conversation.title}
      </Text>
      {conversation.isShared && !isReceived && (
        <ShareIcon style={{
          width: "12px",
          height: "12px",
          color: Colors.Text.Primary.Default,
          flexShrink: 0,
          opacity: hovered || isActive ? 0 : 0.6,
          transition: "opacity 0.15s ease",
        }} />
      )}
      {!isReceived && (
        <button
          onClick={(e) => { e.stopPropagation(); onShare(conversation.id); }}
          title="Compartir"
          style={{
            background: "transparent",
            border: "none",
            padding: "4px",
            cursor: "pointer",
            borderRadius: "4px",
            color: Colors.Text.Neutral.Subdued,
            opacity: hovered || isActive ? 1 : 0,
            transition: "opacity 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            visibility: hovered || isActive ? "visible" : "hidden",
          }}
        >
          <ShareIcon style={{ width: "14px", height: "14px" }} />
        </button>
      )}
      {!isReceived && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); }}
          onMouseEnter={() => setShowDelete(true)}
          onMouseLeave={() => setShowDelete(false)}
          style={{
            background: "transparent",
            border: "none",
            padding: "4px",
            cursor: "pointer",
            borderRadius: "4px",
            color: showDelete ? Colors.Text.Neutral.Default : Colors.Text.Neutral.Subdued,
            opacity: hovered || isActive ? 1 : 0,
            transition: "opacity 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            visibility: hovered || isActive ? "visible" : "hidden",
          }}
        >
          <DeleteIcon style={{ width: "14px", height: "14px" }} />
        </button>
      )}
    </div>
  );
};