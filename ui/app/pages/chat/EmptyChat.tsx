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
      <Heading level={2}>¿Con que incidente puedo ayudarte hoy?</Heading>
      <Text style={{ color: Colors.Text.Neutral.Subdued, textAlign: "center", maxWidth: "500px" }}>
        Inicia una conversación escribiendo un mensaje a continuación. Puedo extraer y correlacionar información de Dynatrace, Github, ServiceNow y archivos postmortem.
      </Text>
      <Flex gap={16} flexWrap="wrap" justifyContent="center" style={{ maxWidth: "600px" }}>
        {[
          "Cuantos problemas activos existen en Dynatrace?",
          "Muestrame un analisis de logs,traces y excepciones del microservicio ms-ux-ma-miep-gestion-cliente",
          "Existen tickets en ServiceNow relacionados con errores en el microservicio ms-ne-notificacion-emision-rentas-vda",
          "Busca en los archivos postmortem si hemos tenido problemas en GuideWire anteriormente",
        ].map((suggestion) => (
          <Flex
            key={suggestion}
            padding={12}
            flex="1 1 calc(50% - 16px)"
            style={{
              background: Colors.Background.Container.Neutral.Default,
              borderRadius: "8px",
              cursor: "pointer",
              border: `1px solid ${Colors.Border.Neutral.Default}`,
              boxSizing: "border-box",
            }}
          >
            <Text>{suggestion}</Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
};
