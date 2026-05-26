import { useMemo, useRef, useEffect } from "react";
import { useListDocuments } from "@dynatrace-sdk/react-hooks";
import type { DocumentMetaData } from "@dynatrace-sdk/client-document";

const CONVERSATION_DOC_TYPE = "sre.copilot.agents";

export interface ConversationListHook {
  conversations: DocumentMetaData[];
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

const EMPTY_ARRAY: DocumentMetaData[] = [];

export const useConversationsList = (): ConversationListHook => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } =   useListDocuments(
    {
      filter: `type=='${CONVERSATION_DOC_TYPE}'`,
      sort: '-modificationInfo.lastModifiedTime',
      pageSize: 30,
    },
    {
      autoFetch: true,
      autoFetchOnUpdate: true,
    }
  );

  // Keep track of the last valid data to prevent flickering during refetch
  const lastValidDataRef = useRef<DocumentMetaData[]>(EMPTY_ARRAY);

  useEffect(() => {
    if (data?.documents) {
      lastValidDataRef.current = data.documents;
    }
  }, [data]);

  return useMemo(() => {
    // If we have data, use it.
    // If we don't have data (e.g. initial load or error) BUT we have stale data, use stale data while loading.
    const conversations = data?.documents ?? (isLoading && lastValidDataRef.current.length > 0 ? lastValidDataRef.current : EMPTY_ARRAY);
    
    return {
      conversations,
      isLoading,
      error: error,
      refetch,
    };
  }, [data, isLoading, error, refetch]);
};
