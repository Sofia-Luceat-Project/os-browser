/**
 * settingsStore.ts
 * バックエンドのレジストリ API と通信して、アプリごとの設定を管理する。
 */
import { ref } from 'vue';

export interface AppSettings {
  backgroundOpacity?: number;
  syntaxHighlighting?: boolean;
  supportedExtensions?: string[];
  [key: string]: any;
}

const settings = ref<Record<string, AppSettings>>({});

export function useSettings(appId: string) {
  const appSettings = ref<AppSettings>({});

  const fetchSettings = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/settings/${appId}`);
      appSettings.value = await res.json();
      settings.value[appId] = appSettings.value;
    } catch (err) {
      console.error(`Failed to fetch settings for ${appId}:`, err);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await fetch(`http://localhost:3000/api/settings/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      appSettings.value = newSettings;
      settings.value[appId] = newSettings;
    } catch (err) {
      console.error(`Failed to save settings for ${appId}:`, err);
    }
  };

  return {
    settings: appSettings,
    fetchSettings,
    saveSettings
  };
}
