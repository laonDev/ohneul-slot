import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "ohneul-slot",
  brand: {
    displayName: "오늘 뭐먹지 슬롯", // 콘솔 등록값과 동일하게 유지하세요.
    primaryColor: "#FF6B35", // 식욕 도는 오렌지 (앱 테마색)
    icon: "https://placehold.co/512x512/FF6B35/ffffff?text=🎰", // 콘솔 등록 후 실제 아이콘 URL로 교체
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
