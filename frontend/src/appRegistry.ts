/**
 * appRegistry.ts
 * バックエンドから取得したアプリ設定を管理する。
 */
import { ref } from 'vue';

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  showInContext: boolean;
  pinned: boolean;
  supportedExtensions?: string[];
}

export const apps = ref<Record<string, AppConfig>>({});

/**
 * バックエンドからアプリ設定を取得する
 */
export const fetchApps = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/apps');
    apps.value = await response.json();
  } catch (err) {
    console.error('Failed to fetch app registry:', err);
  }
};

/**
 * 指定されたファイル拡張子に対応するアプリのリストを取得する
 */
export const getAppsForExtension = (ext: string) => {
  return Object.values(apps.value).filter(app => 
    app.showInContext && (
      app.supportedExtensions?.includes(ext.toLowerCase()) || 
      app.supportedExtensions?.includes('*')
    )
  );
};
