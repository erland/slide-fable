import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with {type:'json'};
export default defineConfig({
  base:'./',
  plugins:[react()],
  define:{__BUILD_ID__:JSON.stringify(process.env.SF_BUILD_ID??pkg.version)},
  build:{emptyOutDir:true,target:'es2022',sourcemap:false},
});
