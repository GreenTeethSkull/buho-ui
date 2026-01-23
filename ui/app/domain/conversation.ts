// Definición de un mensaje individual
export interface ConversationMessage {
    role: "user" | "assistant" | "system"; // Quién envió el mensaje
    content: string;                       // El texto del mensaje
    timestamp: string;                     // Fecha ISO 8601
    model?: string;                        // (Opcional) Si el modelo cambia por mensaje
}

// Detalles adicionales y contexto
export interface ConversationDetails {
    summary?: string;          // Resumen generado por IA (para listas rápidas)
    tags?: string[];           // Etiquetas para filtrar (ej: "incidente", "duda")
    customContext?: Record<string, unknown>; // Datos flexibles extra
}

// Estructura principal del Documento
export interface ConversationDocument {
    // Identificadores
    conversationId: string;    // ID único de la sesión (puede coincidir con doc ID)
    
    // Configuración
    modelId: string;           // El modelo usado para esta conversación (ej: "lucy", "buho")
    
    // Contenido
    messages: ConversationMessage[];
    
    // Metadatos adicionales
    details?: ConversationDetails;
    
    // Auditoría
    createdAt: string;
    updatedAt: string;
}

// UI Types
export interface Model {
    id: string;
    name: string;
    description?: string;
}
