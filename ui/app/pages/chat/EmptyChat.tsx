import React, { useState, useEffect } from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Heading } from "@dynatrace/strato-components/typography";
import { AiIcon, AgentIcon, SaveIcon, DocumentIcon, CodeIcon } from "@dynatrace/strato-icons";
import { useChatTheme } from "../../hooks/useChatTheme";

const ThinkingCircle: React.FC = () => {
  const theme = useChatTheme();
  const [particles, setParticles] = useState<{ id: number; delay: number }[]>([]);

  useEffect(() => {
    const p = Array.from({ length: 12 }, (_, i) => ({ id: i, delay: i * 0.15 }));
    setParticles(p);
  }, []);

  return (
    <Flex alignItems="center" justifyContent="center" style={{ position: "relative", width: "100px", height: "100px" }}>
      <style>{`
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: var(--o1); }
          50% { transform: scale(1.15); opacity: var(--o2); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: rotate(var(--r)) translateY(-38px) scale(1); opacity: 0.7; }
          50% { transform: rotate(var(--r)) translateY(-46px) scale(1.3); opacity: 1; }
        }
      `}</style>
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          style={{
            position: "absolute",
            width: `${60 + ring * 28}px`,
            height: `${60 + ring * 28}px`,
            borderRadius: "50%",
            border: `2px solid ${theme.accent}${[60, 35, 20][ring]}`,
            animation: "pulseRing 2s ease-in-out infinite",
            animationDelay: `${ring * 0.35}s`,
            ["--o1" as string]: [0.7, 0.4, 0.25][ring],
            ["--o2" as string]: [0.3, 0.15, 0.05][ring],
          }}
        />
      ))}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: theme.accent,
            animation: "floatParticle 2.5s ease-in-out infinite",
            animationDelay: `${p.delay}s`,
            ["--r" as string]: `${p.id * 30}deg`,
          }}
        />
      ))}
      <Flex
        alignItems="center"
        justifyContent="center"
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}60)`,
          boxShadow: `0 0 35px ${theme.accent}50, 0 0 70px ${theme.accent}25, inset 0 0 20px rgba(255,255,255,0.15)`,
          zIndex: 10,
        }}
      >
        <AiIcon style={{ width: "34px", height: "34px", color: theme.accent }} />
      </Flex>
    </Flex>
  );
};

interface EmptyChatProps {
  onSuggestionClick?: (message: string) => void;
}

const SUGGESTIONS = [
  { text: "¿Cuántos problemas activos existen en Dynatrace?", icon: AgentIcon, color: "#58a6ff" },
  { text: "Muéstrame un análisis de logs del microservicio ms-ux-ma-miep", icon: SaveIcon, color: "#a371f7" },
  { text: "¿Existen tickets en ServiceNow relacionados con errores?", icon: DocumentIcon, color: "#3fb950" },
  { text: "Busca en archivos postmortem problemas anteriores", icon: CodeIcon, color: "#f0883e" },
];

export const EmptyChat: React.FC<EmptyChatProps> = ({ onSuggestionClick }) => {
  const theme = useChatTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleClick = (suggestion: string) => { if (onSuggestionClick) onSuggestionClick(suggestion); };

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" gap={32} style={{ flex: 1, padding: "32px 16px" }}>
      <Flex flexDirection="column" alignItems="center" gap={16}>
        <ThinkingCircle />
        <Flex flexDirection="column" alignItems="center" gap={8}>
          <Heading level={1} style={{ color: theme.textPrimary, textAlign: "center", fontSize: "24px", fontWeight: 700 }}>Lucy AI</Heading>
          <span style={{ color: theme.textTertiary, textAlign: "center", maxWidth: "400px", fontSize: "14px", lineHeight: "1.6" }}>
            Puedo extraer y correlacionar información de Dynatrace, Github, ServiceNow y archivos postmortem
          </span>
        </Flex>
      </Flex>

      <Flex gap={12} flexWrap="wrap" justifyContent="center" style={{ maxWidth: "700px", width: "100%" }}>
        {SUGGESTIONS.map((sug, index) => {
          const IconComponent = sug.icon;
          return (
            <Flex key={sug.text} flex="1 1 calc(50% - 12px)" minWidth="260px" maxWidth="340px" padding={12}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleClick(sug.text)}
              style={{
                background: hoveredIndex === index ? theme.surfaceHover : theme.surface,
                borderRadius: "10px",
                cursor: "pointer",
                border: `1px solid ${hoveredIndex === index ? sug.color : theme.sidebarBorder}`,
                transition: "all 0.2s ease",
                transform: hoveredIndex === index ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <Flex alignItems="flex-start" gap={8} style={{ flex: 1 }}>
                <Flex alignItems="center" justifyContent="center" style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${sug.color}20`, flexShrink: 0 }}>
                  <IconComponent style={{ width: "14px", height: "14px", color: sug.color }} />
                </Flex>
                <span style={{ color: theme.textSecondary, fontSize: "13px", lineHeight: "1.5", flex: 1 }}>{sug.text}</span>
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
};
