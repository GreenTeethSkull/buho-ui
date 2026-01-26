import { Button } from "@dynatrace/strato-components/buttons";
import { ProgressCircle } from "@dynatrace/strato-components/content";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { CloseSidebarIcon, OpenSidebarIcon } from "@dynatrace/strato-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ConversationDocument, ConversationMessage, Model } from "../../domain/conversation";
import { useConversationContent, useConversationManager } from "../../hooks/useConversationManager";
import { useConversationsList } from "../../hooks/useConversationsList";
import { useChatSession } from "../../hooks/useChatSession";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ChatSidebar, SidebarConversation } from "./ChatSidebar";
import { EmptyChat } from "./EmptyChat";
import { ModelSelector } from "./ModelSelector";
import type { DocumentMetaData } from "@dynatrace-sdk/client-document";

const MOCK_MODELS: Model[] = [
  { id: "lucy", name: "Lucy", description: "All in one incident management agent" },
  { id: "buho", name: "Buho", description: "All in one incident management agent" }
];

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MOCK_MODELS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations: conversationsList, refetch: refetchConversations } = useConversationsList();
  const { deleteConversation } = useConversationManager();
  const {
    sessionState,
    isConnected,
    startNewSession,
    resumeSession,
    sendMessage,
    endSession,
  } = useChatSession();

  const { document: selectedDoc, isLoading: isLoadingDoc } = useConversationContent(activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionState.messages]);

  useEffect(() => {
    if (conversationsList) {
      const mappedConversations: SidebarConversation[] = conversationsList.map((doc: DocumentMetaData) => ({
        id: doc.id,
        title: doc.name || "Conversación",
        updatedAt: doc.modificationInfo?.lastModifiedTime ? new Date(doc.modificationInfo.lastModifiedTime) : new Date(),
        version: doc.version,
      }));
      mappedConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setConversations(mappedConversations);
    }
  }, [conversationsList, selectedModel]);

  useEffect(() => {
    const urlId = searchParams.get("id");
    if (urlId && urlId !== activeConversationId) {
      setActiveConversationId(urlId);
    }
  }, [searchParams, activeConversationId]);

  useEffect(() => {
    const loadAndResumeSession = async () => {
      if (!activeConversationId || !selectedDoc || sessionState.isActive) return;
      if (selectedDoc.metadata?.id !== activeConversationId) return;

      try {
        if (!selectedDoc.content) return;
        const contentText = await selectedDoc.content.get("text");
        const contentJson = JSON.parse(contentText) as ConversationDocument;

        await resumeSession(
          activeConversationId,
          { ...contentJson, messages: contentJson.messages || [] },
          selectedDoc.metadata?.version ?? "1",
          selectedDoc.metadata?.name ?? "Chat"
        );
      } catch (e) {
        console.error("Failed to resume session", e);
      }
    };

    void loadAndResumeSession();
  }, [selectedDoc, activeConversationId, sessionState.isActive, resumeSession]);

  const handleNewChat = useCallback(async () => {
    endSession();
    setActiveConversationId(null);
    setSearchParams({});
  }, [setSearchParams, endSession]);

  const handleSelectConversation = useCallback((id: string) => {
    if (sessionState.isActive) {
      endSession();
    }
    setSearchParams({ id });
    setActiveConversationId(id);
  }, [setSearchParams, sessionState.isActive, endSession]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      const conversationToDelete = conversations.find(c => c.id === id);
      if (!conversationToDelete) return;

      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        endSession();
        setActiveConversationId(null);
        setSearchParams({});
      }

      const success = await deleteConversation(id, conversationToDelete.version);
      if (success) {
        refetchConversations();
      } else {
        refetchConversations();
      }
    } catch (error) {
      console.error("Error deleting conversation", error);
      refetchConversations();
    }
  }, [conversations, activeConversationId, setSearchParams, deleteConversation, refetchConversations, endSession]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!sessionState.isActive) {
      const success = await startNewSession(selectedModel);
      if (!success) {
        console.error("Failed to start session");
        return;
      }
    }

    await sendMessage(content);
  }, [sessionState.isActive, startNewSession, sendMessage]);

  const isLoading = sessionState.isConnecting || (isLoadingDoc && activeConversationId && sessionState.messages.length === 0);

  return (
    <Flex style={{ height: "100%", overflow: "hidden" }}>
      {sidebarOpen && (
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => void handleNewChat()}
          onDeleteConversation={(id) => void handleDeleteConversation(id)}
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
            {isConnected && (
              <Text style={{ color: Colors.Text.Success.Default }}>Connected</Text>
            )}
            <Text style={{ color: Colors.Text.Neutral.Subdued }}>
              {sessionState.messages.length} messages
            </Text>
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
          {isLoading ? (
            <Flex justifyContent="center" alignItems="center" style={{ flex: 1 }}>
              <ProgressCircle />
            </Flex>
          ) : sessionState.messages.length === 0 ? (
            <EmptyChat onSuggestionClick={(msg) => void handleSendMessage(msg)} />
          ) : (
            <Flex flexDirection="column" gap={8} padding={16} style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>
              {sessionState.messages.map((message, index) => (
                <ChatMessage key={`${index}-${message.timestamp}`} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </Flex>
          )}
        </Flex>

        <ChatInput
          onSendMessage={(msg) => void handleSendMessage(msg)}
          disabled={sessionState.isConnecting || sessionState.isSending}
          placeholder="Escribe un mensaje..."
        />
      </Flex>
    </Flex>
  );
};