import React, { useState, useRef, useEffect, useCallback } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { Text } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { CloseSidebarIcon, OpenSidebarIcon } from "@dynatrace/strato-icons";
import { ProgressCircle } from "@dynatrace/strato-components/content";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { EmptyChat } from "./EmptyChat";
import { Conversation, Message, Model } from "./types";
import { useChatSession } from "../../hooks/useChatSession";
import type { ConversationMessage } from "../../hooks/useConversationDocuments";

const MOCK_MODELS: Model[] = [
  { id: "lucy", name: "Lucy", description: "All in one incident management agent" },
  { id: "buho", name: "Buho", description: "All in one incident management agent" }
];

const mapConversationMessageToMessage = (msg: ConversationMessage, index: number): Message => ({
  id: `msg-${index}-${msg.timestamp}`,
  role: msg.role === "user" ? "user" : "assistant",
  content: msg.text,
  timestamp: new Date(msg.timestamp),
});

export const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MOCK_MODELS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessionState,
    startNewSession,
    resumeSession,
    sendMessage,
    endSession,
    getConversationHistory,
    refetchList,
  } = useChatSession();

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionState.messages]);

  useEffect(() => {
    const loadHistory = async () => {
      await refetchList();
      const history = getConversationHistory();
      const mappedConversations: Conversation[] = history.map((doc) => ({
        id: doc.id,
        title: doc.name || "Conversación",
        messages: [],
        model: selectedModel,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      setConversations(mappedConversations);
    };
    loadHistory();
  }, []);

  const handleNewChat = useCallback(async () => {
    setIsInitializing(true);
    endSession();
    const success = await startNewSession();
    if (success && sessionState.documentId) {
      const newConversation: Conversation = {
        id: sessionState.documentId,
        title: "Nuevo Chat",
        messages: [],
        model: selectedModel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(sessionState.documentId);
    }
    setIsInitializing(false);
  }, [startNewSession, endSession, sessionState.documentId, selectedModel]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      endSession();
    }
  }, [activeConversationId, endSession]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!sessionState.isActive) {
      setIsInitializing(true);
      const success = await startNewSession();
      setIsInitializing(false);
      if (!success) return;
    }

    await sendMessage(content);

    if (activeConversation && activeConversation.messages.length === 0) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, title: content.substring(0, 30) + (content.length > 30 ? "..." : "") }
            : c
        )
      );
    }
  }, [sessionState.isActive, startNewSession, sendMessage, activeConversation, activeConversationId]);

  const displayMessages: Message[] = sessionState.messages.map(mapConversationMessageToMessage);

  return (
    <Flex style={{ height: "100%", overflow: "hidden" }}>
      {sidebarOpen && (
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <Flex flexDirection="column" style={{ flex: 1, overflow: "hidden" }}>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          padding={12}
          style={{
            borderBottom: `1px solid ${Colors.Border.Neutral.Default}`,
            background: Colors.Background.Surface.Default,
          }}
        >
          <Flex alignItems="center" gap={12}>
            <Button variant="default" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <CloseSidebarIcon /> : <OpenSidebarIcon />}
            </Button>
            <ModelSelector
              models={MOCK_MODELS}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={sessionState.isActive}
            />
          </Flex>
          <Flex alignItems="center" gap={8}>
            {sessionState.isActive && (
              <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                {sessionState.messages.length} messages
              </Text>
            )}
          </Flex>
        </Flex>

        <Flex
          flexDirection="column"
          style={{
            flex: 1,
            overflowY: "auto",
            background: Colors.Background.Base.Default,
          }}
        >
          {isInitializing ? (
            <Flex justifyContent="center" alignItems="center" style={{ flex: 1 }}>
              <ProgressCircle />
            </Flex>
          ) : displayMessages.length === 0 ? (
            <EmptyChat onSuggestionClick={handleSendMessage} />
          ) : (
            <Flex flexDirection="column" gap={8} padding={16} style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>
              {displayMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </Flex>
          )}
        </Flex>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isInitializing}
          placeholder="Escribe un mensaje..."
        />
      </Flex>
    </Flex>
  );
};