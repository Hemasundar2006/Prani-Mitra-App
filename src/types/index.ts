export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface NavItem {
  name: string;
  label: string;
  icon: string;
}

