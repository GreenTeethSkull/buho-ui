import { useCallback } from "react";
import { documentsClient } from "@dynatrace-sdk/client-document";
import type { DocumentMetaData } from "@dynatrace-sdk/client-document";
import { PlatformBinary } from "@dynatrace-sdk/http-client";
import { useListDocuments } from "@dynatrace-sdk/react-hooks";

export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    model?: string;
}

export interface ConversationDocument {
    conversationId: string;
    messages: ConversationMessage[];
    createdAt: string;
    updatedAt: string;
}

const CONVERSATION_TYPE = "buho-conversation";

export const useConversationDocuments = () => {
    const {
        data: documentsList,
        isLoading: isListLoading,
        refetch: refetchList,
    } = useListDocuments(
        { filter: `type=='${CONVERSATION_TYPE}'` },
        { autoFetch: true, autoFetchOnUpdate: false }
    );

    const createConversationDocument = useCallback(
        async (conversationId: string): Promise<string | null> => {
            console.log("[useConversationDocuments] Creating document for conversationId:", conversationId);
            try {
                const now = new Date().toISOString();
                const content: ConversationDocument = {
                    conversationId,
                    messages: [],
                    createdAt: now,
                    updatedAt: now,
                };

                console.log("[useConversationDocuments] Document content:", content);
                console.log("[useConversationDocuments] Calling documentsClient.createDocument...");

                const result = await documentsClient.createDocument({
                    body: {
                        name: `Conversation ${conversationId}`,
                        type: CONVERSATION_TYPE,
                        content: PlatformBinary.fromJson(content),
                    },
                });

                console.log("[useConversationDocuments] createDocument result:", result);

                if (!result?.id) {
                    console.error("[useConversationDocuments] No document ID in result");
                    return null;
                }

                console.log("[useConversationDocuments] Document created with ID:", result.id);
                return result.id;
            } catch (error) {
                console.error("[useConversationDocuments] Error creating conversation document:", error);
                return null;
            }
        },
        []
    );

    const addMessageToConversation = useCallback(
        async (
            documentId: string,
            version: string,
            name: string,
            currentContent: ConversationDocument,
            role: "user" | "assistant" | "system",
            content: string
        ): Promise<boolean> => {
            console.log("[useConversationDocuments] Adding message to document:", documentId);
            const newMessage: ConversationMessage = {
                role,
                content,
                timestamp: new Date().toISOString(),
            };

            const updatedContent: ConversationDocument = {
                ...currentContent,
                messages: [...currentContent.messages, newMessage],
                updatedAt: new Date().toISOString(),
            };

            try {
                console.log("[useConversationDocuments] Updating document with version:", version);
                await documentsClient.updateDocument({
                    id: documentId,
                    optimisticLockingVersion: version,
                    body: {
                        name,
                        content: PlatformBinary.fromJson(updatedContent),
                    },
                });
                console.log("[useConversationDocuments] Document updated successfully");
                return true;
            } catch (error) {
                console.error("[useConversationDocuments] Error updating conversation document:", error);
                return false;
            }
        },
        []
    );

    const getConversationContent = useCallback(
        async (documentId: string): Promise<ConversationDocument | null> => {
            console.log("[useConversationDocuments] Getting content for document:", documentId);
            try {
                const doc = await documentsClient.getDocument({ id: documentId });
                if (doc.content) {
                    const contentText = await doc.content.get("text");
                    const content = JSON.parse(contentText) as ConversationDocument;
                    console.log("[useConversationDocuments] Content retrieved:", content);
                    return content;
                }
                return null;
            } catch (error) {
                console.error("[useConversationDocuments] Error fetching conversation content:", error);
                return null;
            }
        },
        []
    );

    return {
        createConversationDocument,
        addMessageToConversation,
        getConversationContent,
        documentsList,
        isListLoading,
        refetchList,
    };
};