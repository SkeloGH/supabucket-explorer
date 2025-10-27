declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      createDirectory: (path: string) => Promise<{ success: boolean; error?: string }>;
      downloadFile: (url: string, localPath: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export {};

