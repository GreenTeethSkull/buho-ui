# Lucy — SRE Agents Chat App

Custom app de Dynatrace que expone una interfaz de chat para interactuar con agentes de IA de gestión de incidentes desarrollados en **Microsoft Copilot Studio**, integrados mediante el protocolo **Direct Line** del Bot Framework.

---

## Descripcion

**Lucy** (`my.sre.agents`) es una aplicacion embebida en la plataforma Dynatrace construida con el SDK oficial de Dynatrace Apps. Proporciona una interfaz conversacional tipo chat que permite a los equipos SRE interactuar con agentes de IA especializados en la gestion de incidentes directamente desde el entorno de observabilidad donde ya trabajan.

La aplicacion esta construida sobre **React 18** y el sistema de diseno **Strato** de Dynatrace, con logica de backend ejecutada como **App Functions** serverless dentro de App Engine.

---

## Arquitectura

```
buho-ui/
├── ui/                        # Frontend React (Strato Design System)
│   ├── main.tsx               # Punto de entrada
│   └── app/
│       ├── App.tsx            # Enrutador principal
│       ├── components/        # Componentes reutilizables (Header, Card)
│       ├── domain/            # Tipos de dominio (ConversationDocument, Model)
│       ├── hooks/             # Logica de negocio (sesion, Direct Line, documentos)
│       ├── pages/
│       │   └── chat/          # Vista principal de chat
│       │       ├── Chat.tsx           # Orquestador del chat
│       │       ├── ChatInput.tsx      # Barra de entrada de mensajes
│       │       ├── ChatMessage.tsx    # Renderizado de mensajes (Markdown)
│       │       ├── ChatSidebar.tsx    # Historial de conversaciones
│       │       ├── EmptyChat.tsx      # Estado vacio inicial
│       │       └── ModelSelector.tsx  # Selector de agente activo
│       └── services/
│           └── logService.ts  # Envio de logs al stack de Dynatrace
└── api/                       # App Functions (backend serverless)
    ├── copilot-directline-token.function.ts        # Genera/refresca tokens Direct Line
    ├── copilot-directline-conversation.function.ts # Crea conversaciones Direct Line
    ├── copilot-directline-activities.function.ts   # Polling de actividades del bot
    ├── copilot-directline-send-activity.function.ts# Envio de mensajes al bot
    ├── copilot-directline.shared.ts                # Utilidades de validacion compartidas
    └── directline.function.ts                      # Funcion auxiliar Direct Line
```

---

## Funcionalidades

- **Chat en tiempo real** con agentes de Copilot Studio via Direct Line (polling de actividades)
- **Historial de conversaciones** persistido en Dynatrace Documents API
- **Reanudacion de sesiones** — carga y retoma conversaciones anteriores desde la barra lateral
- **Renderizado Markdown** en las respuestas del agente (con soporte GFM)
- **Gestion de tokens Direct Line** — generacion y refresco automatico via Credential Vault de Dynatrace
- **Logging de conversaciones** hacia el stack de logs de Dynatrace
- **Selector de agente** (modelo) desde la UI
- **Soporte de tema** claro/oscuro alineado con el tema de Dynatrace

### Agentes disponibles

| ID | Nombre | Descripcion |
|----|--------|-------------|
| `lucy` | Lucy | Agente todo-en-uno de gestion de incidentes |
| `buho` | Buho | Agente todo-en-uno de gestion de incidentes |

---

## Requisitos previos

- Node.js >= 16.13.0
- Acceso a un entorno de Dynatrace con App Engine habilitado
- Un bot de **Microsoft Copilot Studio** con canal **Direct Line** configurado
- Credencial del secreto Direct Line almacenada en el **Credential Vault** de Dynatrace
- Schema de settings configurado: `app:my.dynatrace.sre.toolkit:sre-toolkit-copilot-directline`

---

## Instalacion

```bash
npm install
```

---

## Desarrollo local

```bash
npx dt-app dev
```

Levanta la app en modo desarrollo con hot-reload apuntando al entorno configurado en `app.config.json` (`https://hmc05194.apps.dynatrace.com/`).

---

## Deploy

```bash
npx dt-app deploy
```

Publica la version actual de la app en el entorno de Dynatrace definido en `app.config.json`. La version se controla en el campo `app.version` del mismo archivo.

---

## Actualizar dependencias del SDK

```bash
npx dt-app update
```

Actualiza las dependencias del SDK de Dynatrace (`@dynatrace-sdk/*`, `@dynatrace/*`, `dt-app`) a sus ultimas versiones compatibles.

---

## Otros comandos utiles

```bash
npm run build          # Compila la app para produccion
npm run lint           # Ejecuta ESLint sobre todo el proyecto
npm run info           # Muestra informacion del entorno y la app desplegada
npm run uninstall      # Desinstala la app del entorno Dynatrace
npm run create:function  # Scaffolding de una nueva App Function
npm run create:action    # Scaffolding de una nueva Action
```

---

## Permisos (Scopes)

La app requiere los siguientes scopes de OAuth en el entorno Dynatrace:

| Scope | Uso |
|-------|-----|
| `storage:logs:read` / `write` | Lectura e ingestion de logs |
| `storage:buckets:read` | Acceso a buckets de almacenamiento |
| `document:documents:read/write/delete` | Persistencia del historial de conversaciones |
| `app-engine:apps:run` | Ejecucion de App Functions |
| `app-settings:objects:read` | Lectura de configuracion de la app |
| `settings:objects:read` | Lectura de settings del entorno |
| `environment-api:credentials:read` | Lectura del secreto Direct Line desde Credential Vault |

---

## Stack tecnologico

| Capa | Tecnologia |
|------|-----------|
| Framework UI | React 18 |
| Design System | Dynatrace Strato Components |
| Routing | React Router DOM v6 |
| Backend | Dynatrace App Functions (serverless) |
| Protocolo bot | Microsoft Bot Framework Direct Line v3 |
| Persistencia | Dynatrace Documents API |
| Observabilidad | Dynatrace Logs API |
| Markdown | react-markdown + remark-gfm |
| Linting | ESLint 9 + @microsoft/eslint-plugin-sdl |
