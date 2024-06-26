import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

//按需导入图标
import path from 'path'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import UnoCSS from 'unocss/vite'
import presetIcons from "@unocss/preset-icons";
import transformerDirective from "@unocss/transformer-directives";

import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

const pathSrc = path.resolve(__dirname, 'src')

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': pathSrc,
    },
  },
  plugins: [
    vue(),
    UnoCSS({
      Transformers: [transformerDirective()],
      presets: [
        presetIcons({
          collections: {
            ic: () =>
              import("@iconify-json/ic/icons.json").then((i) => i.default),
          },
        }),
      ],
    }),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar'
          ]
        }
      ],
      resolvers: [
        ElementPlusResolver(),
         // 自动导入图标组件
         IconsResolver({
          prefix: 'Icon',
        }),
      ],
      dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
    }),
    Components({
      resolvers: [
        IconsResolver({
          enabledCollections: ['ep'],
        }),
        ElementPlusResolver(),
        NaiveUiResolver()
      ],
      dts: path.resolve(pathSrc, 'components.d.ts'),
    }),
    Icons({
      autoInstall: true,
    }),
  ],
  // proxy: {
  //   '/ws': {
  //     target: "https://apis.map.qq.com"
  //   }
  // }
})
