import { Button } from "@dynatrace/strato-components/buttons";
import { ProgressCircle } from "@dynatrace/strato-components/content";
import { AiLoadingIndicator } from "@dynatrace/strato-components-preview/content";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { Select, SelectOption, SelectContent, SelectTrigger } from "@dynatrace/strato-components-preview/forms";
import { OpenSidebarIcon, AIModelIcon } from "@dynatrace/strato-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ConversationDocument, Model } from "../../domain/conversation";
import { useConversationContent, useConversationManager } from "../../hooks/useConversationManager";
import { useConversationsList } from "../../hooks/useConversationsList";
import { useChatSession } from "../../hooks/useChatSession";
import { useChatTheme } from "../../hooks/useChatTheme";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ChatSidebar, SidebarConversation } from "./ChatSidebar";
import { EmptyChat } from "./EmptyChat";
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
  const [isStartingMessage, setIsStartingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const theme = useChatTheme();

  const { conversations: conversationsList, refetch: refetchConversations } = useConversationsList();
  const { deleteConversation } = useConversationManager();
  const { sessionState, isConnected, startNewSession, resumeSession, sendMessage, endSession } = useChatSession();
  const { document: selectedDoc, isLoading: isLoadingDoc } = useConversationContent(activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [sessionState.messages]);

  useEffect(() => {
    if (conversationsList) {
      const mapped: SidebarConversation[] = conversationsList.map((doc: DocumentMetaData) => ({
        id: doc.id,
        title: doc.name || "Conversación",
        updatedAt: doc.modificationInfo?.lastModifiedTime ? new Date(doc.modificationInfo.lastModifiedTime) : new Date(),
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
        await resumeSession(activeConversationId, { ...contentJson, messages: contentJson.messages || [] }, selectedDoc.metadata?.version ?? "1", selectedDoc.metadata?.name ?? "Chat");
      } catch (e) { console.error("Failed to resume session", e); }
    };
    void loadAndResumeSession();
  }, [selectedDoc, activeConversationId, sessionState.isActive, resumeSession]);

  const handleNewChat = useCallback(() => { endSession(); setActiveConversationId(null); setSearchParams({}); }, [setSearchParams, endSession]);
  const handleSelectConversation = useCallback((id: string) => { if (sessionState.isActive) endSession(); setSearchParams({ id }); setActiveConversationId(id); }, [setSearchParams, sessionState.isActive, endSession]);
  
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      const conversationToDelete = conversations.find(c => c.id === id);
      if (!conversationToDelete) return;
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) { endSession(); setActiveConversationId(null); setSearchParams({}); }
      const success = await deleteConversation(id, conversationToDelete.version);
      void success;
      refetchConversations();
    } catch (error) { console.error("Error deleting conversation", error); refetchConversations(); }
  }, [conversations, activeConversationId, setSearchParams, deleteConversation, refetchConversations, endSession]);

  const handleSendMessage = useCallback(async (content: string) => {
    const shouldStartSession = !sessionState.isActive;
    if (shouldStartSession) setIsStartingMessage(true);
    try {
      if (shouldStartSession) {
        const success = await startNewSession(selectedModel);
        if (!success) { console.error("Failed to start session"); return; }
        refetchConversations();
      }
      await sendMessage(content);
    } finally {
      if (shouldStartSession) setIsStartingMessage(false);
    }
  }, [refetchConversations, selectedModel, sendMessage, sessionState.isActive, startNewSession]);

  const isLoading = sessionState.isConnecting || ((isLoadingDoc && activeConversationId) || isStartingMessage) && sessionState.messages.length === 0;
  const lastMessageIsFromUser = sessionState.messages.length > 0 && sessionState.messages[sessionState.messages.length - 1].role === "user";
  const showLoadingIndicator = sessionState.isSending || (lastMessageIsFromUser && sessionState.isSending);

  return (
    <Flex style={{ height: "calc(100vh - 64px)", overflow: "hidden", background: theme.chatBg }}>
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={(id) => void handleDeleteConversation(id)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <Flex flexDirection="column" style={{ flex: 1, overflow: "hidden" }}>
        <Flex alignItems="center" justifyContent="space-between" padding={8} paddingLeft={12} style={{ background: theme.inputAreaBg, borderBottom: `1px solid ${theme.inputAreaBorder}` }}>
          <Flex alignItems="center" gap={8}>
            {!sidebarOpen && (
              <Button variant="default" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: theme.surfaceHover, border: `1px solid ${theme.border}`, padding: "4px 6px", minHeight: "auto" }}>
                <OpenSidebarIcon style={{ width: "14px", height: "14px" }} />
              </Button>
            )}
            <Flex alignItems="center" gap={6}>
              <Text style={{ color: theme.textSecondary, fontSize: "12px", fontWeight: 500 }}>Agente:</Text>
              <Select value={selectedModel} onChange={(v) => setSelectedModel(v as string)} disabled={sessionState.isActive}>
                <SelectTrigger style={{ minWidth: "100px", height: "28px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "4px", color: theme.textPrimary, fontSize: "12px", padding: "0 8px", cursor: sessionState.isActive ? "not-allowed" : "pointer" }} />
                <SelectContent style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "6px" }}>
                  {MOCK_MODELS.map((model) => (
                    <SelectOption key={model.id} value={model.id} style={{ color: theme.textPrimary, borderRadius: "4px", padding: "6px 10px", fontSize: "12px" }}>
                      {model.name}
                    </SelectOption>
                  ))}
                </SelectContent>
              </Select>
            </Flex>
          </Flex>
          <Flex alignItems="center" gap={12}>
            {isConnected && (
              <Flex alignItems="center" gap={4}>
                <Flex style={{ width: "6px", height: "6px", borderRadius: "50%", background: theme.success }} />
                <span style={{ color: theme.success, fontSize: "11px", fontWeight: 500 }}>Conectado</span>
              </Flex>
            )}
            <span style={{ color: theme.textTertiary, fontSize: "11px" }}>{sessionState.messages.length} mens.</span>
          </Flex>
        </Flex>
        
        <Flex flexDirection="column" style={{ flex: 1, overflowY: "auto", background: theme.chatBg }}>
          {isLoading ? (
            <Flex justifyContent="center" alignItems="center" style={{ flex: 1 }}>
              <Flex flexDirection="column" alignItems="center" gap={16}>
                <ProgressCircle />
                <Text style={{ color: theme.textTertiary }}>Cargando conversación...</Text>
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
        </Flex>

        <ChatInput
          onSendMessage={(msg) => void handleSendMessage(msg)}
          disabled={sessionState.isConnecting || sessionState.isSending}
        />
      </Flex>
    </Flex>
  );
};
