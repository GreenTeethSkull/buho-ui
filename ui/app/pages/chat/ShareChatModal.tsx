import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "@dynatrace/strato-components-preview/overlays";
import { Button } from "@dynatrace/strato-components/buttons";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text } from "@dynatrace/strato-components/typography";
import { CopyIcon, ShareIcon } from "@dynatrace/strato-icons";
import { showToast } from "@dynatrace/strato-components-preview/notifications";
import Colors from "@dynatrace/strato-design-tokens/colors";
import type { EnvironmentShare } from "@dynatrace-sdk/client-document";
import { useEnvironmentShare } from "../../hooks/useEnvironmentShare";

interface ShareChatModalProps {
  conversationId: string;
  conversationName: string;
  onDismiss: () => void;
}

export const ShareChatModal: React.FC<ShareChatModalProps> = ({
  conversationId,
  conversationName,
  onDismiss,
}) => {
  const { createShare, getShare, deleteShare, buildShareLink } = useEnvironmentShare();
  const [share, setShare] = useState<EnvironmentShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const existing = await getShare(conversationId);
      setShare(existing);
      setIsLoading(false);
    };
    void load();
  }, [conversationId, getShare]);

  const handleCreate = useCallback(async () => {
    setIsWorking(true);
    const created = await createShare(conversationId);
    setShare(created);
    setIsWorking(false);
  }, [conversationId, createShare]);

  const handleCopy = useCallback(async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(buildShareLink(share.id));
      setCopied(true);
      showToast({ title: "Link copiado", message: "El link se copió al portapapeles.", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("ShareChatModal.handleCopy", error);
    }
  }, [share, buildShareLink]);

  const handleStopSharing = useCallback(async () => {
    if (!share) return;
    setIsWorking(true);
    const success = await deleteShare(share.id);
    setIsWorking(false);
    if (success) {
      setShare(null);
      showToast({ title: "Compartir detenido", message: "El chat ya no está compartido.", type: "success" });
    }
  }, [share, deleteShare]);

  const shareLink = share ? buildShareLink(share.id) : "";

  return (
    <Modal
      show
      title={`Compartir "${conversationName}"`}
      onDismiss={onDismiss}
      size="small"
      footer={
        share ? (
          <Flex justifyContent="flex-end" width="100%">
            <Button
              variant="emphasized"
              color="critical"
              onClick={() => void handleStopSharing()}
              disabled={isWorking}
            >
              Dejar de compartir
            </Button>
          </Flex>
        ) : undefined
      }
    >
      {isLoading ? (
        <Text style={{ color: Colors.Text.Neutral.Subdued }}>Cargando...</Text>
      ) : share ? (
        <Flex flexDirection="column" gap={16}>
          <Text style={{ color: Colors.Text.Neutral.Default, fontSize: "14px" }}>
            Cualquier persona de este entorno con el link puede ver esta conversación.
          </Text>
          <div style={{ position: "relative" }}>
            <input
              readOnly
              value={shareLink}
              onClick={(e) => e.currentTarget.select()}
              style={{
                width: "100%",
                background: Colors.Background.Container.Neutral.Subdued,
                border: `1px solid ${Colors.Border.Neutral.Default}`,
                borderRadius: "8px",
                padding: "8px 36px 8px 10px",
                color: Colors.Text.Neutral.Default,
                fontSize: "12px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => void handleCopy()}
              title="Copiar link"
              style={{
                position: "absolute",
                right: "4px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                borderRadius: "4px",
                color: copied ? Colors.Text.Primary.Default : Colors.Text.Neutral.Subdued,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CopyIcon style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
          <Text style={{ color: Colors.Text.Neutral.Subdued, fontSize: "12px" }}>
            {share.claimCount > 0
              ? `Compartido con ${share.claimCount} ${share.claimCount === 1 ? "persona" : "personas"}.`
              : "Aún nadie ha abierto este link."}
          </Text>
        </Flex>
      ) : (
        <Flex flexDirection="column" gap={16} alignItems="flex-start">
          <Text style={{ color: Colors.Text.Neutral.Default, fontSize: "14px" }}>
            Crea un link para compartir esta conversación con otras personas de tu entorno.
          </Text>
          <Button
            variant="emphasized"
            onClick={() => void handleCreate()}
            disabled={isWorking}
          >
            <ShareIcon style={{ width: "16px", height: "16px", marginRight: "6px" }} />
            Crear link
          </Button>
        </Flex>
      )}
    </Modal>
  );
};
