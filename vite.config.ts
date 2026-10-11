import {defineConfig,loadEnv} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig(({command,mode})=>{const api=process.env.VITE_API_BASE_URL||loadEnv(mode,process.cwd(),'VITE_').VITE_API_BASE_URL;if(command==='build'&&(!api||!/^https:\/\//.test(api)))throw new Error('請先設定 HTTPS 後端網址 VITE_API_BASE_URL，避免發布無法儲存的網站。');return {base:'./',plugins:[react()]}});
