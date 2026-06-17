import { useCallback } from "react";
import {
  environmentSharesClient,
  isShareAlreadyExists,
  isClaimingOwnedShareNotAllowed,
  isShareNotFound,
} from "@dynatrace-sdk/client-document";
import type {
  EnvironmentShare,
  EnvironmentShareClaimResult,
} from "@dynatrace-sdk/client-document";
import { getEnvironmentUrl, getAppId } from "@dynatrace-sdk/app-environment";
import { showToast } from "@dynatrace/strato-components-preview/notifications";

export const useEnvironmentShare = () => {
  const getShare = useCallback(
    async (documentId: string): Promise<EnvironmentShare | null> => {
      try {
        const result = await environmentSharesClient.listEnvironmentShares({
          filter: `documentId=='${documentId}'`,
          pageSize: 100,
        });
        const readShare = result["environment-shares"].find((share) =>
          share.access.includes("read")
        );
        return readShare ?? null;
      } catch (error) {
        console.error("useEnvironmentShare.getShare", error);
        return null;
      }
    },
    []
  );

  const getShareById = useCallback(
    async (shareId: string): Promise<EnvironmentShare | null> => {
      try {
        return await environmentSharesClient.getEnvironmentShare({ id: shareId });
      } catch (error) {
        console.error("useEnvironmentShare.getShareById", error);
        return null;
      }
    },
    []
  );

  const createShare = useCallback(
    async (documentId: string): Promise<EnvironmentShare | null> => {
      try {
        const share = await environmentSharesClient.createEnvironmentShare({
          body: { documentId, access: "read" },
        });
        return share;
      } catch (error) {
        if (isShareAlreadyExists(error)) {
          return getShare(documentId);
        }
        console.error("useEnvironmentShare.createShare", error);
        showToast({
          title: "Error al compartir",
          message: "No se pudo crear el link de compartir.",
          type: "critical",
        });
        return null;
      }
    },
    [getShare]
  );

  const deleteShare = useCallback(
    async (shareId: string): Promise<boolean> => {
      try {
        await environmentSharesClient.deleteEnvironmentShare({ id: shareId });
        return true;
      } catch (error) {
        console.error("useEnvironmentShare.deleteShare", error);
        showToast({
          title: "Error al dejar de compartir",
          message: "No se pudo revocar el link.",
          type: "critical",
        });
        return false;
      }
    },
    []
  );

  const claimShare = useCallback(
    async (shareId: string): Promise<EnvironmentShareClaimResult | null> => {
      try {
        return await environmentSharesClient.claimEnvironmentShare({
          id: shareId,
        });
      } catch (error) {
        if (isClaimingOwnedShareNotAllowed(error)) {
          const share = await environmentSharesClient.getEnvironmentShare({
            id: shareId,
          });
          return {
            documentId: share.documentId,
            documentType: "",
            access: share.access,
          };
        }
        if (isShareNotFound(error)) {
          return null;
        }
        console.error("useEnvironmentShare.claimShare", error);
        return null;
      }
    },
    []
  );

  const buildShareLink = useCallback((shareId: string): string => {
    const envUrl = getEnvironmentUrl().replace(/\/$/, "");
    const appId = getAppId();
    const params = new URLSearchParams(window.location.search);
    params.delete("id");
    params.delete("DT_APP_ID");
    params.set("share", shareId);
    return `${envUrl}/ui/apps/${appId}/?${params.toString()}`;
  }, []);

  return {
    createShare,
    getShare,
    getShareById,
    deleteShare,
    claimShare,
    buildShareLink,
  };
};
