import { useCallback } from "react";
import { PlatformBinary } from "@dynatrace-sdk/http-client";
import { useUpdateDocument, useDocument } from "@dynatrace-sdk/react-hooks";
import { documentsClient } from "@dynatrace-sdk/client-document";
import { showToast } from "@dynatrace/strato-components-preview/notifications";
import type { DocumentMetaData } from "@dynatrace-sdk/client-document";
import type { ConversationDocument } from "../domain/conversation";

const CONVERSATION_DOC_TYPE = "sre.copilot.agents";
const CONVERSATION_TRASH_TYPE = "sre.copilot.agents.trash";

export interface CreateConversationParams {
  id: string; // ID is required to associate it
  name?: string;
  initialContent: ConversationDocument;
}

export const useConversationManager = () => {
  // We keep useUpdateDocument for consistency, but switch create to client directly
  const { execute: updateDoc, isLoading: isUpdating } = useUpdateDocument();

  const createConversation = useCallback(
    async ({ id, name, initialContent }: CreateConversationParams): Promise<DocumentMetaData | null> => {
      try {
        console.log("useConversationManager: Calling documentsClient.createDocument...");
        
        const result = await documentsClient.createDocument({
          body: {
            name: name ?? `Chat ${id}`,
            type: CONVERSATION_DOC_TYPE,
            content: PlatformBinary.fromJson(initialContent),
          },
        });
        
        console.log("useConversationManager: createDocument result:", result);
        return result;
      } catch (error) {
        console.error("Error creating conversation:", error);
        showToast({
          title: "Error al crear",
          message: "No se pudo crear la conversación.",
          type: "critical",
        });
        return null;
      }
    },
    []
  );

  const deleteConversation = useCallback(
    async (id: string, version: string): Promise<boolean> => {
      try {
        await updateDoc({
          id,
          optimisticLockingVersion: version,
          body: {
            type: CONVERSATION_TRASH_TYPE,
          },
        });

        showToast({
          title: "Conversación eliminada",
          message: "La conversación se ha movido a la papelera.",
          type: "success",
        });
        return true;
      } catch (error) {
        console.error("Error deleting conversation", error);
        showToast({
          title: "Error al eliminar",
          message: "No se pudo eliminar la conversación.",
          type: "critical",
        });
        return false;
      }
    },
    [updateDoc]
  );

  const updateConversation = useCallback(
    async (id: string, version: string, name: string, content: ConversationDocument): Promise<string | null> => {
      try {
        const result = await documentsClient.updateDocument({
          id,
          optimisticLockingVersion: version,
          body: {
            name,
            content: PlatformBinary.fromJson(content),
          },
        });
        return result.documentMetadata.version;
      } catch (error) {
        console.error("Error updating conversation", error);
        showToast({
            title: "Error al guardar",
            message: "No se pudo guardar el mensaje.",
            type: "critical",
        });
        return null;
      }
    },
    []
  );

  return {
    createConversation,
    deleteConversation,
    updateConversation,
    isUpdating,
  };
};

/**
 * Hook separate to fetch a single conversation content
 */
export const useConversationContent = (id: string | null) => {
    const { data, isLoading, error, refetch } = useDocument(
        { id: id ?? "" },
        { autoFetch: !!id, autoFetchOnUpdate: true }
    );

    return {
        document: data,
        isLoading,
        error,
        refetch
    };
};
