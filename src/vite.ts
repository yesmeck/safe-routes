import * as Vite from 'vite';
import { DEFAULT_OUTPUT_DIR_PATH, build } from './build.js';

interface PluginConfig {
  strict?: boolean;
  outDir?: string;
}

const ReactRouterPluginContextName = '__reactRouterPluginContext';

export function reactRouterRoutes(pluginConfig: PluginConfig = {}): Vite.Plugin {
  let reactRouterPlugin: any;
  let rootDirectory: string
  let viteUserConfig: Vite.UserConfig;
  let viteConfigEnv: Vite.ConfigEnv;
  let ctx: any;

  function generateTypeFile() {
    if (!ctx) {
      return;
    }
    build(rootDirectory, ctx.reactRouterConfig, { strict: pluginConfig.strict, outputDirPath: pluginConfig.outDir || DEFAULT_OUTPUT_DIR_PATH });
  }

  async function reloadCtx() {
    const config = await reactRouterPlugin.config(viteUserConfig, viteConfigEnv);
    ctx = (config as any)[ReactRouterPluginContextName];
  }

  return {
    name: 'react-router-routes',
    enforce: 'post',
    apply: 'build',
    config(_viteUserConfig, _viteConfigEnv) {
      viteUserConfig = _viteUserConfig;
      viteConfigEnv = _viteConfigEnv;
    },
    configResolved(config) {
      console.log('configResolved');
      reactRouterPlugin = config.plugins.find((plugin) => plugin.name === 'react-router');
      if (!reactRouterPlugin) {
        console.warn('react-router plugin not found.');
        return;
      }
      rootDirectory = config.root;
      ctx = (config as any)[ReactRouterPluginContextName];
      generateTypeFile();
    },
    async watchChange(id, change) {
      if (!reactRouterPlugin) {
        return;
      }
      if (change.event === 'update') {
        return;
      }
      await reloadCtx();
      generateTypeFile();
    },
  }
}
