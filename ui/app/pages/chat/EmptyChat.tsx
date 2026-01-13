import React from "react";
import { Flex } from "@dynatrace/strato-components/layouts";
import { Text, Heading } from "@dynatrace/strato-components/typography";
import Colors from "@dynatrace/strato-design-tokens/colors";
import { DavisAIIcon } from "@dynatrace/strato-icons";

export const EmptyChat: React.FC = () => {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={24}
      style={{ flex: 1, padding: "48px" }}
    >
      <Flex
        alignItems="center"
        justifyContent="center"
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: Colors.Background.Container.Neutral.Emphasized,
        }}
      >
        <DavisAIIcon style={{ width: "40px", height: "40px" }} />
      </Flex>
      <Heading level={2}>How can I help you today?</Heading>
      <Text style={{ color: Colors.Text.Neutral.Subdued, textAlign: "center", maxWidth: "500px" }}>
        Start a conversation by typing a message below. I can help you with questions, 
        creative writing, analysis, coding, and much more.
      </Text>
      <Flex gap={16} flexWrap="wrap" justifyContent="center" style={{ maxWidth: "600px" }}>
        {[
          "Explain quantum computing",
          "Write a poem about nature",
          "Help me debug my code",
          "Summarize a complex topic",
        ].map((suggestion) => (
          <Flex
            key={suggestion}
            padding={12}
            style={{
              background: Colors.Background.Container.Neutral.Default,
              borderRadius: "8px",
              cursor: "pointer",
              border: `1px solid ${Colors.Border.Neutral.Default}`,
            }}
          >
            <Text>{suggestion}</Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};
