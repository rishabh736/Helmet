import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{port:5173,headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'credentialless'},proxy:{'/api':'http://localhost:5050','/evidence':'http://localhost:5050'}}});
