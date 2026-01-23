import { useCallback } from "react";
import type { DocumentMetaData } from "@dynatrace-sdk/client-document";
import { PlatformBinary } from "@dynatrace-sdk/http-client";
import { useDocument, useUpdateDocument } from "@dynatrace-sdk/react-hooks";
import { showToast } from "@dynatrace/strato-components-preview/notifications";

/**
 * Hook simple para cargar y persistir documentos JSON en Dynatrace.
 * Responsabilidad única: operaciones de lectura/escritura de documentos.
 */
export const useDocumentPersistence = <T>(
  document: DocumentMetaData | null
) => {
  const { isLoading: isDocLoading, refetch: refetchDoc } = useDocument(
    document ? { id: document.id } : { id: "" },
    { autoFetch: false, autoFetchOnUpdate: false }
  );

  const { execute: updateDoc, isLoading: isUpdating } = useUpdateDocument();

  /**
   * Carga el contenido del documento como JSON
   */
  const loadContent = useCallback(async (): Promise<T | null> => {
    if (!document) return null;

    try {
      const response = await refetchDoc();
      if (!response?.content) return null;

      const contentText = await response.content.get("text");
      const parsed = JSON.parse(contentText) as T;
      return parsed;
    } catch (error) {
      console.error("useDocumentPersistence.loadContent", error);
      showToast({
        title: "Error al cargar",
        message: "No se pudo leer el contenido del documento.",
        type: "critical",
      });
      return null;
    }
  }, [document, refetchDoc]);

  /**
   * Guarda contenido JSON en el documento
   */
  const saveContent = useCallback(
    async (content: T): Promise<boolean> => {
      if (!document) return false;

      try {
        const contentBinary = PlatformBinary.fromJson(content);
        await updateDoc({
          id: document.id,
          optimisticLockingVersion: document.version,
          body: {
            name: document.name,
            content: contentBinary,
          },
        });
        return true;
      } catch (error) {
        console.error("useDocumentPersistence.saveContent", error);
        showToast({
          title: "Error al guardar",
          message: "No se pudo actualizar el documento.",
          type: "critical",
        });
        return false;
      }
    },
    [document, updateDoc]
  );

  return {
    loadContent,
    saveContent,
    isDocLoading,
    isUpdating,
  };
};
