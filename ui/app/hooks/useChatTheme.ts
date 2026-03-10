import { useCurrentTheme } from "@dynatrace/strato-components/core";

export type ThemeMode = "light" | "dark";

export interface ChatThemeColors {
  appBg: string;
  chatBg: string;
  sidebarBg: string;
  sidebarBorder: string;
  messageUserBg: string;
  messageUserBorder: string;
  messageBotBg: string;
  messageBotBorder: string;
  messageSeparator: string;
  inputAreaBg: string;
  inputAreaBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentLight: string;
  accentMuted: string;
  success: string;
  surface: string;
  surfaceHover: string;
  border: string;
}

const dark: ChatThemeColors = {
  appBg: "#010409",
  chatBg: "#0d1117",
  sidebarBg: "#0d1117",
  sidebarBorder: "#21262d",
  messageUserBg: "#161b22",
  messageUserBorder: "#30363d",
  messageBotBg: "#0d1117",
  messageBotBorder: "#21262d",
  messageSeparator: "#21262d",
  inputAreaBg: "#161b22",
  inputAreaBorder: "#30363d",
  inputBg: "#0d1117",
  inputBorder: "#30363d",
  inputFocusBorder: "#58a6ff",
  textPrimary: "#f0f6fc",
  textSecondary: "#8b949e",
  textTertiary: "#6e7681",
  accent: "#58a6ff",
  accentBg: "#1f6feb",
  accentBorder: "#388bfd",
  accentLight: "#79c0ff",
  accentMuted: "#1f6feb",
  success: "#3fb950",
  surface: "#161b22",
  surfaceHover: "#21262d",
  border: "#30363d",
};

const light: ChatThemeColors = {
  appBg: "#f6f8fa",
  chatBg: "#ffffff",
  sidebarBg: "#ffffff",
  sidebarBorder: "#e1e4e8",
  messageUserBg: "#f6f8fa",
  messageUserBorder: "#d0d7de",
  messageBotBg: "#ffffff",
  messageBotBorder: "#e1e4e8",
  messageSeparator: "#e8eaed",
  inputAreaBg: "#ffffff",
  inputAreaBorder: "#d0d7de",
  inputBg: "#f6f8fa",
  inputBorder: "#d0d7de",
  inputFocusBorder: "#0969da",
  textPrimary: "#1f2328",
  textSecondary: "#656d76",
  textTertiary: "#8c959f",
  accent: "#0969da",
  accentBg: "#ddf4ff",
  accentBorder: "#afb9c2",
  accentLight: "#0550ae",
  accentMuted: "#ddf4ff",
  success: "#1a7f37",
  surface: "#ffffff",
  surfaceHover: "#f6f8fa",
  border: "#d0d7de",
};

export const useChatTheme = (): ChatThemeColors => {
  const theme = useCurrentTheme();
  return theme === "dark" ? dark : light;
};
