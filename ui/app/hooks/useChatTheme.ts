import { useCurrentTheme } from "@dynatrace/strato-components/core";
import Colors from "@dynatrace/strato-design-tokens/colors";

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
  appBg: Colors.Background.Base.Default,
  chatBg: Colors.Background.Surface.Default,
  sidebarBg: Colors.Background.Surface.Default,
  sidebarBorder: Colors.Border.Neutral.Default,
  messageUserBg: Colors.Background.Container.Neutral.Emphasized,
  messageUserBorder: Colors.Border.Neutral.Default,
  messageBotBg: Colors.Background.Surface.Default,
  messageBotBorder: Colors.Border.Neutral.Default,
  messageSeparator: Colors.Border.Neutral.Default,
  inputAreaBg: Colors.Background.Container.Neutral.Emphasized,
  inputAreaBorder: Colors.Border.Neutral.Default,
  inputBg: Colors.Background.Surface.Default,
  inputBorder: Colors.Border.Neutral.Default,
  inputFocusBorder: Colors.Text.Primary.Default,
  textPrimary: Colors.Text.Neutral.Default,
  textSecondary: Colors.Text.Neutral.Subdued,
  textTertiary: Colors.Text.Neutral.Subdued,
  accent: Colors.Text.Primary.Default,
  accentBg: Colors.Background.Container.Primary.Default,
  accentBorder: Colors.Border.Primary.Default,
  accentLight: Colors.Theme.Primary['80'],
  accentMuted: Colors.Background.Container.Primary.Default,
  success: Colors.Text.Success.Default,
  surface: Colors.Background.Container.Neutral.Emphasized,
  surfaceHover: Colors.Background.Container.Neutral.Default,
  border: Colors.Border.Neutral.Default,
};

const light: ChatThemeColors = {
  appBg: Colors.Background.Base.Default,
  chatBg: Colors.Background.Surface.Default,
  sidebarBg: Colors.Background.Surface.Default,
  sidebarBorder: Colors.Border.Neutral.Default,
  messageUserBg: Colors.Background.Container.Neutral.Default,
  messageUserBorder: Colors.Border.Neutral.Default,
  messageBotBg: Colors.Background.Surface.Default,
  messageBotBorder: Colors.Border.Neutral.Default,
  messageSeparator: Colors.Border.Neutral.Default,
  inputAreaBg: Colors.Background.Surface.Default,
  inputAreaBorder: Colors.Border.Neutral.Default,
  inputBg: Colors.Background.Container.Neutral.Default,
  inputBorder: Colors.Border.Neutral.Default,
  inputFocusBorder: Colors.Text.Primary.Default,
  textPrimary: Colors.Text.Neutral.Default,
  textSecondary: Colors.Text.Neutral.Subdued,
  textTertiary: Colors.Text.Neutral.Subdued,
  accent: Colors.Text.Primary.Default,
  accentBg: Colors.Background.Container.Primary.Default,
  accentBorder: Colors.Border.Primary.Default,
  accentLight: Colors.Theme.Primary['60'],
  accentMuted: Colors.Background.Container.Primary.Default,
  success: Colors.Text.Success.Default,
  surface: Colors.Background.Surface.Default,
  surfaceHover: Colors.Background.Container.Neutral.Default,
  border: Colors.Border.Neutral.Default,
};

export const useChatTheme = (): ChatThemeColors => {
  const theme = useCurrentTheme();
  return theme === "dark" ? dark : light;
};
