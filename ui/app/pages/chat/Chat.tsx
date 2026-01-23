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
  const [isInitializing, setIsInitializing] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations: conversationsList, refetch: refetchConversations } = useConversationsList();
  const { createConversation, deleteConversation, updateConversation } = useConversationManager();

  const { document: selectedDoc, isLoading: isLoadingDoc } = useConversationContent(activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationsList) {
      const mappedConversations: SidebarConversation[] = conversationsList.map((doc: DocumentMetaData) => ({
        id: doc.id,
        title: doc.name || "Conversación",
        updatedAt: doc.modificationInfo?.lastModifiedTime ? new Date(doc.modificationInfo.lastModifiedTime) : new Date(),
        version: doc.version,
      }));
      // Sort by last modified (newest first)
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
    const loadContent = async () => {
        console.log("loadContent effect", { activeConversationId, selectedDoc, isInitializing });
        if (!activeConversationId) {
            setMessages([]);
            return;
        }

        // If doc is loading, don't clear messages yet unless we are switching to a known empty state
        if (!selectedDoc) {
             console.log("Doc loading or not found yet");
             return;
        }

        // Verify that the loaded document matches the active conversation ID
        if (selectedDoc.metadata?.id !== activeConversationId) {
             console.log("Doc ID mismatch", selectedDoc.metadata?.id, activeConversationId);
             return;
        }

        try {
            if (!selectedDoc.content) {
                 console.log("Doc has no content");
                 return;
            }

            const contentText = await selectedDoc.content.get("text");
            const contentJson = JSON.parse(contentText) as ConversationDocument;

            console.log("Loaded content messages:", contentJson.messages?.length);

            if (contentJson && Array.isArray(contentJson.messages)) {
                // Only update if we have messages, or if we really want to clear.
                // To avoid clearing optimistic updates if fetch is slightly delayed/empty:
                if (contentJson.messages.length > 0) {
                    setMessages(contentJson.messages);
                } else if (messages.length === 0) {
                    // Only clear if we have nothing locally either (truly empty)
                    setMessages([]);
                }
            }
        } catch (e) {
            console.error("Failed to parse document content", e);
            // Don't wipe messages on error to preserve optimistic state if possible
        }
    };

    void loadContent();
  }, [selectedDoc, activeConversationId, messages.length, isInitializing]);

  const handleNewChat = useCallback(() => {
    // Just clear state to show welcome screen
    setActiveConversationId(null);
    setSearchParams({});
    setMessages([]);
  }, [setSearchParams]);

  const handleSelectConversation = useCallback((id: string) => {
    setSearchParams({ id });
    setActiveConversationId(id);
  }, [setSearchParams]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
        const conversationToDelete = conversations.find(c => c.id === id);
        if (!conversationToDelete) return;

        // Optimistic UI update
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setSearchParams({});
          setMessages([]);
        }

        // Soft delete using manager
        const success = await deleteConversation(id, conversationToDelete.version);

        if (success) {
            // Success toast is handled by manager
            refetchConversations();
        } else {
            // Revert optimistic update if needed, or rely on refetch
            refetchConversations();
        }

    } catch (error) {
        console.error("Error deleting conversation", error);
        refetchConversations();
    }
  }, [conversations, activeConversationId, setSearchParams, deleteConversation, refetchConversations]);

  const handleSendMessage = useCallback(async (content: string) => {
    // If no active chat, create one first
    let currentDocId = activeConversationId;

    if (!currentDocId) {
        setIsInitializing(true);
        const randomId = Math.random().toString(36).substring(7);
        const newDocName = `Chat ${randomId}`;
        const now = new Date().toISOString();

        const initialMessages: ConversationMessage[] = [{
            role: "user",
            content: content,
            timestamp: now
        }];

        const docContent: ConversationDocument = {
            conversationId: randomId,
            modelId: selectedModel,
            messages: initialMessages,
            createdAt: now,
            updatedAt: now,
        };

        console.log("Creating new conversation...");
        const result = await createConversation({
            id: randomId,
            name: content.substring(0, 30) || newDocName,
            initialContent: docContent
        });
        console.log("Create result:", result);

        if (result?.id) {
            console.log("Chat: URL Update Triggered with ID:", result.id);
            currentDocId = result.id;
            setSearchParams({ id: result.id });
            setActiveConversationId(result.id);
            setMessages(initialMessages);
            refetchConversations();
        } else {
            console.error("Failed to get ID from created conversation");
        }
        setIsInitializing(false);
        // return; // Explicitly returning nothing is consistent with void, but 'return;' is fine in async func returning Promise<void>.
        // Just ensuring linter is happy.
    }

    const newMessage: ConversationMessage = {
        role: "user",
        content: content,
        timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages); // Optimistic update

    if (selectedDoc && currentDocId) {
        try {
             // Reconstruct full document content
             const currentContentText = await selectedDoc.content?.get("text");
             const currentContent = currentContentText ? JSON.parse(currentContentText) as ConversationDocument : null;

             const updatedContent: ConversationDocument = {
                 conversationId: currentContent?.conversationId || (selectedDoc.metadata?.name ?? "chat"),
                 modelId: currentContent?.modelId || selectedModel,
                 messages: updatedMessages,
                 details: currentContent?.details,
                 updatedAt: new Date().toISOString(),
                 createdAt: currentContent?.createdAt || new Date().toISOString(),
             };

             await updateConversation(
                 currentDocId,
                 selectedDoc.metadata?.version ?? "1",
                 selectedDoc.metadata?.name ?? "Chat",
                 updatedContent
             );
        } catch (e) {
            console.error("Failed to save message", e);
        }
    }

  }, [activeConversationId, createConversation, updateConversation, messages, refetchConversations, selectedDoc, setSearchParams, selectedModel]);

  // const displayMessages: Message[] = messages.map(mapConversationMessageToMessage);

  return (
    <Flex style={{ height: "100%", overflow: "hidden" }}>
      {sidebarOpen && (
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
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
              disabled={false}
            />
          </Flex>
          <Flex alignItems="center" gap={8}>
            <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                {messages.length} messages
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
          {isInitializing || (isLoadingDoc && activeConversationId && messages.length === 0) ? (
            <Flex justifyContent="center" alignItems="center" style={{ flex: 1 }}>
              <ProgressCircle />
            </Flex>
          ) : messages.length === 0 ? (
            <EmptyChat onSuggestionClick={(msg) => void handleSendMessage(msg)} />
          ) : (
            <Flex flexDirection="column" gap={8} padding={16} style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>
              {messages.map((message, index) => (
                <ChatMessage key={`${index}-${message.timestamp}`} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </Flex>
          )}
        </Flex>

        <ChatInput
          onSendMessage={(msg) => void handleSendMessage(msg)}
          disabled={isInitializing}
          placeholder="Escribe un mensaje..."
        />
      </Flex>
    </Flex>
  );
};
