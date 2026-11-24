import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>{const vars=loadEnv(mode,process.cwd(),'');return {base:vars.VITE_BASE_PATH||'/',plugins:[react()],server:{proxy:{'/api':{target:'http://127.0.0.1:8787',changeOrigin:true}}},build:{outDir:'dist',emptyOutDir:true}}});
