import { useCallback } from "react";
import type { DocumentMetaData } from "@dynatrace-sdk/client-document";
import { PlatformBinary } from "@dynatrace-sdk/http-client";
import {
    useCreateDocument,
    useUpdateDocument,
    useListDocuments,
} from "@dynatrace-sdk/react-hooks";

export interface ConversationMessage {
    role: "user" | "model";
    text: string;
    timestamp: string;
}

export interface ConversationDocument {
    conversationId: string;
    messages: ConversationMessage[];
    createdAt: string;
    updatedAt: string;
}

const CONVERSATION_TYPE = "buho-conversation";

export const useConversationDocuments = () => {
    const { execute: createDoc, isLoading: isCreating } = useCreateDocument();
    const { execute: updateDoc, isLoading: isUpdating } = useUpdateDocument();
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
            try {
                const now = new Date().toISOString();
                const content: ConversationDocument = {
                    conversationId,
                    messages: [],
                    createdAt: now,
                    updatedAt: now,
                };

                const result = await createDoc({
                    body: {
                        name: `Conversation ${conversationId}`,
                        type: CONVERSATION_TYPE,
                        content: PlatformBinary.fromJson(content),
                    },
                });

                await refetchList();
                return (result as DocumentMetaData | undefined)?.id ?? null;
            } catch (error) {
                console.error("Failed to create conversation document:", error);
                return null;
            }
        },
        [createDoc, refetchList]
    );

    const updateConversationDocument = useCallback(
        async (
            documentId: string,
            version: string,
            name: string,
            content: ConversationDocument
        ): Promise<boolean> => {
            try {
                content.updatedAt = new Date().toISOString();
                await updateDoc({
                    id: documentId,
                    optimisticLockingVersion: version,
                    body: {
                        name,
                        content: PlatformBinary.fromJson(content),
                    },
                });
                return true;
            } catch (error) {
                console.error("Failed to update conversation document:", error);
                return false;
            }
        },
        [updateDoc]
    );

    const addMessageToConversation = useCallback(
        async (
            documentId: string,
            version: string,
            name: string,
            currentContent: ConversationDocument,
            role: "user" | "model",
            text: string
        ): Promise<boolean> => {
            const newMessage: ConversationMessage = {
                role,
                text,
                timestamp: new Date().toISOString(),
            };

            const updatedContent: ConversationDocument = {
                ...currentContent,
                messages: [...currentContent.messages, newMessage],
            };

            return updateConversationDocument(documentId, version, name, updatedContent);
        },
        [updateConversationDocument]
    );

    const getConversationHistory = useCallback(() => {
        return documentsList?.documents ?? [];
    }, [documentsList]);

    return {
        createConversationDocument,
        updateConversationDocument,
        addMessageToConversation,
        getConversationHistory,
        refetchList,
        isCreating,
        isUpdating,
        isListLoading,
    };
};