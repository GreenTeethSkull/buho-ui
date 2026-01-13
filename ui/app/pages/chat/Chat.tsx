import React, { useState, useRef, useEffect } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Button } from "@dynatrace/strato-components/buttons";
import { Text } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { SettingIcon, MenuIcon } from "@dynatrace/strato-icons";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { EmptyChat } from "./EmptyChat";
import { Conversation, Message, Model } from "./types";

const MOCK_MODELS: Model[] = [
  { id: "gpt-4", name: "GPT-4", description: "Most capable model" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and efficient" },
  { id: "claude-3", name: "Claude 3", description: "Anthropic's latest model" },
  { id: "llama-2", name: "Llama 2", description: "Open source model" },
];

export const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MOCK_MODELS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      model: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId) {
      const newConversation: Conversation = {
        id: generateId(),
        title: content.substring(0, 30) + (content.length > 30 ? "..." : ""),
        messages: [],
        model: selectedModel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === newConversation.id
            ? { ...c, messages: [...c.messages, userMessage], updatedAt: new Date() }
            : c
        )
      );

      simulateResponse(newConversation.id);
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              title: c.messages.length === 0 ? content.substring(0, 30) + (content.length > 30 ? "..." : "") : c.title,
              updatedAt: new Date(),
            }
          : c
      )
    );

    simulateResponse(activeConversationId);
  };

  const simulateResponse = async (conversationId: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content:
        "This is a simulated response. In a real implementation, this would be connected to an AI backend service. The response would be generated based on your message and the selected model.",
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
          : c
      )
    );
    setIsLoading(false);
  };

  return (
    <Flex style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
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
              <MenuIcon />
            </Button>
            <ModelSelector
              models={MOCK_MODELS}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </Flex>
          <Flex alignItems="center" gap={8}>
            {activeConversation && (
              <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                {activeConversation.messages.length} messages
              </Text>
            )}
            <Button variant="default">
              <SettingIcon />
            </Button>
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
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <EmptyChat />
          ) : (
            <Flex flexDirection="column" gap={8} padding={16} style={{ maxWidth: "900px", margin: "0 auto", width: "100%" }}>
              {activeConversation.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <Flex padding={16} alignItems="center" gap={8}>
                  <Text style={{ color: Colors.Text.Neutral.Subdued }}>
                    Assistant is typing...
                  </Text>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </Flex>
          )}
        </Flex>

        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </Flex>
    </Flex>
  );
};
