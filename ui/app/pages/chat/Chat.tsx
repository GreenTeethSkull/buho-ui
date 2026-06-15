import { ProgressCircle } from "@dynatrace/strato-components/content";
import { AiLoadingIndicator } from "@dynatrace/strato-components-preview/content";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { AIModelIcon } from "@dynatrace/strato-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ConversationDocument } from "../../domain/conversation";
import { useConversationContent, useConversationManager } from "../../hooks/useConversationManager";
import { useConversationsList } from "../../hooks/useConversationsList";
import { useChatSession } from "../../hooks/useChatSession";
import { useAppShell } from "../../hooks/useAppShell";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ChatSidebar, SidebarConversation } from "./ChatSidebar";
import { EmptyChat } from "./EmptyChat";
import type { DocumentMetaData } from "@dynatrace-sdk/client-document";

const MOCK_MODELS = [
  { id: "lucy", name: "Lucy", description: "All in one incident management agent" },
  { id: "buho", name: "Buho", description: "All in one incident management agent" },
];

export const Chat: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStartingMessage, setIsStartingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sidebarOpen,
    setSidebarOpen,
    selectedModel,
    setSelectedModel,
    setModelSelectorDisabled,
    models,
    setModels,
  } = useAppShell();

  const { conversations: conversationsList, refetch: refetchConversations } = useConversationsList();
  const { deleteConversation } = useConversationManager();
  const { sessionState, startNewSession, resumeSession, sendMessage, endSession } = useChatSession();
  const { document: selectedDoc, isLoading: isLoadingDoc } = useConversationContent(activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [sessionState.messages]);

  useEffect(() => {
    setModels(MOCK_MODELS);
    if (!selectedModel) setSelectedModel(MOCK_MODELS[0].id);
  }, []);

  useEffect(() => {
    setModelSelectorDisabled(sessionState.isActive);
  }, [sessionState.isActive, setModelSelectorDisabled]);

  useEffect(() => {
    if (conversationsList) {
      const mapped: SidebarConversation[] = conversationsList.map((doc: DocumentMetaData) => ({
        id: doc.id,
        title: doc.name || "Conversación",
        updatedAt: doc.modificationInfo?.lastModifiedTime
          ? new Date(doc.modificationInfo.lastModifiedTime)
          : new Date(),
        version: doc.version,
      }));
      mapped.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setConversations(mapped);
    }
  }, [conversationsList, selectedModel]);

  useEffect(() => {
    const urlId = searchParams.get("id");
    if (urlId && urlId !== activeConversationId) setActiveConversationId(urlId);
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
      } catch (e) { console.error("Failed to resume session", e); }
    };
    void loadAndResumeSession();
  }, [selectedDoc, activeConversationId, sessionState.isActive, resumeSession]);

  const handleNewChat = useCallback(() => {
    endSession();
    setActiveConversationId(null);
    setSearchParams({});
  }, [setSearchParams, endSession]);

  const handleSelectConversation = useCallback((id: string) => {
    if (sessionState.isActive) endSession();
    setSearchParams({ id });
    setActiveConversationId(id);
  }, [setSearchParams, sessionState.isActive, endSession]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      const conversationToDelete = conversations.find((c) => c.id === id);
      if (!conversationToDelete) return;
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        endSession();
        setActiveConversationId(null);
        setSearchParams({});
      }
      const success = await deleteConversation(id, conversationToDelete.version);
      void success;
      refetchConversations();
    } catch (error) {
      console.error("Error deleting conversation", error);
      refetchConversations();
    }
  }, [conversations, activeConversationId, setSearchParams, deleteConversation, refetchConversations, endSession]);

  const handleSendMessage = useCallback(async (content: string) => {
    const shouldStartSession = !sessionState.isActive;
    if (shouldStartSession) setIsStartingMessage(true);
    try {
      if (shouldStartSession) {
        const conversationId = await startNewSession(selectedModel);
        if (!conversationId) { console.error("Failed to start session"); return; }
        setActiveConversationId(conversationId);
        setSearchParams({ id: conversationId });
        refetchConversations();
      }
      await sendMessage(content);
      if (shouldStartSession) {
        refetchConversations();
      }
    } finally {
      if (shouldStartSession) setIsStartingMessage(false);
    }
  }, [refetchConversations, selectedModel, sendMessage, sessionState.isActive, startNewSession]);

  const isLoading = (((isLoadingDoc && activeConversationId) || isStartingMessage) && sessionState.messages.length === 0);
  const showLoadingIndicator = sessionState.isSending;

  return (
    <Flex style={{ height: "100%", overflow: "hidden", background: Colors.Background.Base.Default }}>
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={(id) => void handleDeleteConversation(id)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sidebarOpen={sidebarOpen}
      />

      <Flex flexDirection="column" style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "32px", zIndex: 10, pointerEvents: "none",
          background: `linear-gradient(to bottom, ${Colors.Background.Base.Default}, transparent)`,
        }} />
        <div style={{ flex: 1, overflowY: "auto", background: Colors.Background.Base.Default, paddingTop: "12px" }}>
          {isLoading ? (
            <Flex justifyContent="center" alignItems="center" style={{ flex: 1 }}>
              <Flex flexDirection="column" alignItems="center" gap={16}>
                <ProgressCircle />
                <Text style={{ color: Colors.Text.Neutral.Subdued }}>Cargando conversación...</Text>
              </Flex>
            </Flex>
          ) : sessionState.messages.length === 0 ? (
            <EmptyChat onSuggestionClick={(msg) => void handleSendMessage(msg)} />
          ) : (
            <Flex flexDirection="column">
              {sessionState.messages.map((message, index) => (
                <ChatMessage key={`${index}-${message.timestamp}`} message={message} />
              ))}
              {showLoadingIndicator && (
                <AiLoadingIndicator>
                  <AiLoadingIndicator.Icon><AIModelIcon /></AiLoadingIndicator.Icon>
                  Generando respuesta...
                </AiLoadingIndicator>
              )}
              <div ref={messagesEndRef} />
            </Flex>
          )}
        </div>

        <ChatInput
          key={activeConversationId ?? "new"}
          onSendMessage={(msg) => void handleSendMessage(msg)}
          disabled={sessionState.isSending}
        />
      </Flex>
    </Flex>
  );
};