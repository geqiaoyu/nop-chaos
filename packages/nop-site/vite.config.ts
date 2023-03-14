import type { UserConfig, ConfigEnv } from 'vite';
import pkg from './package.json';
import dayjs from 'dayjs';
import { loadEnv } from 'vite';
import { resolve } from 'path';
import { generateModifyVars } from './build/generate/generateModifyVars';
import { createProxy } from './build/vite/proxy';
import { wrapperEnv } from './build/utils';
import { createVitePlugins } from './build/vite/plugin';
import { OUTPUT_DIR } from './build/constant';

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir);
}

const { dependencies, devDependencies, name, version } = pkg;
const __APP_INFO__ = {
  pkg: { dependencies, devDependencies, name, version },
  lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
};

export default ({ command, mode }: ConfigEnv): UserConfig => {
  const root = process.cwd();

  const env = loadEnv(mode, root);

  // The boolean type read by loadEnv is a string. This function can be converted to boolean type
  const viteEnv = wrapperEnv(env);

  const { VITE_PORT, VITE_PUBLIC_PATH, VITE_PROXY, VITE_DROP_CONSOLE } = viteEnv;

  const isBuild = command === 'build';

  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias: [
        {
          find: 'vue-i18n',
          replacement: 'vue-i18n/dist/vue-i18n.cjs.js',
        },
        // /@/xxxx => src/xxxx
        {
          find: /\/@\//,
          replacement: pathResolve('src') + '/',
        },
        // /#/xxxx => types/xxxx
        {
          find: /\/#\//,
          replacement: pathResolve('types') + '/',
        },
      ],
    },
    server: {
      // Listening on all local IPs
      host: true,
      https: false,
      port: VITE_PORT,
      // Load proxy configuration from .env
      proxy: createProxy(VITE_PROXY),
    },
    build: {
      minify: 'esbuild',
      //target: 'es2015',
      //cssTarget: 'chrome80',
      outDir: OUTPUT_DIR,
      terserOptions: {
        compress: {
          keep_infinity: true,
          // Used to delete console in production environment
          //drop_console: VITE_DROP_CONSOLE,
          drop_debugger: true,
        },
      },
      // Turning off brotliSize display can slightly reduce packaging time
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            console.log("id="+id)
            if (id.includes('node_modules/amis-editor')) {
              return "amis-editor"; 
            }
            if (id.includes('node_modules/amis')) {
              return "amis"; 
            }
            if (id.includes('node_modules/monaco-editor')) {
              return "manaco-editor"; 
            }
            if (id.includes('node_modules/tinymce')) {
              return "tinymce"; 
            }
            if (id.includes('node_modules/echarts')) {
              return "echarts"; 
            }
            if (id.includes('node_modules/codemirror')) {
              return "codemirror"; 
            }
            if (id.includes('node_modules/froala-editor')) {
              return "froala-editor"; 
            }
            if (id.includes('node_modules/exceljs')) {
              return "exceljs"; 
            }
            if (id.includes('node_modules')) {
              return "vendor"; 
            }
            if (id.includes('/nop-site/src/')) {
              return "source"; 
            }
          }
        }
      }
    },
    define: {
      // setting vue-i18-next
      // Suppress warning
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: generateModifyVars(),
          javascriptEnabled: true,
        },
      },
    },

    // The vite plugin used by the project. The quantity is large, so it is separately extracted and managed
    plugins: createVitePlugins(viteEnv, isBuild),

    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
      },
      // @iconify/iconify: The dependency is dynamically and virtually loaded by @purge-icons/generated, so it needs to be specified explicitly
      include: [
        '@vue/runtime-core',
        '@vue/shared',
        '@iconify/iconify',
        'ant-design-vue/es/locale/zh_CN',
        'ant-design-vue/es/locale/en_US',
      ],
    },
  };
};
