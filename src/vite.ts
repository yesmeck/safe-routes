import { reactRouter } from "@react-router/dev/vite";
import replace from '@rollup/plugin-replace';
import { join } from 'node:path';
import * as Vite from 'vite';
import { placeholder } from './basename.js';
import { DEFAULT_OUTPUT_DIR_PATH, TYPE_FILE_NAME, build } from './build.js';
import { ReactRouterPluginContext } from './types.js';

export interface PluginOptions {
  strict?: boolean;
  outDir?: string;
}

function extractReactRouterPluginContext(config: Vite.UserConfig | Vite.ResolvedConfig) {
  const reactRouterPluginContextName = '__reactRouterPluginContext';
  if (reactRouterPluginContextName in config) {
    return config[reactRouterPluginContextName] as ReactRouterPluginContext;
  }
  return null;
}

function findReactRouterPlugin(plugins: readonly Vite.Plugin[]) {
  return plugins.find((plugin) => plugin.name === 'react-router');
}

export function safeRoutes(pluginConfig: PluginOptions = {}): Vite.Plugin {
  let reactRouterPlugin: any;
  let rootDirectory: string;
  let viteUserConfig: Vite.UserConfig;
  let viteConfigEnv: Vite.ConfigEnv;
  let ctx: ReactRouterPluginContext | null;

  function generateTypeFile() {
    if (!ctx) {
      return;
    }
    build(rootDirectory, ctx.reactRouterConfig, { strict: pluginConfig.strict, outputDirPath: pluginConfig.outDir || DEFAULT_OUTPUT_DIR_PATH });
  }

  async function reloadCtx() {
    const plugin: any = findReactRouterPlugin(reactRouter());
    if (!plugin || !plugin.config) {
      return;
    }
    const config = await plugin.config(viteUserConfig, { ...viteConfigEnv, command: 'build' });
    ctx = extractReactRouterPluginContext(config);
  }

  return {
    name: 'safe-routes',
    enforce: 'post',
    config(_viteUserConfig, _viteConfigEnv) {
      viteUserConfig = _viteUserConfig;
      viteConfigEnv = _viteConfigEnv;
      if (ctx && ctx.reactRouterConfig.basename) {
        viteUserConfig.plugins?.push(replace.default({
          [placeholder]: ctx.reactRouterConfig.basename,
        }));
      }
    },
    configResolved(config) {
      reactRouterPlugin = findReactRouterPlugin(config.plugins);
      if (!reactRouterPlugin) {
        return;
      }
      rootDirectory = config.root;
      ctx = extractReactRouterPluginContext(config);
      generateTypeFile();
    },
    async watchChange(id) {
      if (!reactRouterPlugin || !ctx) {
        return;
      }

      if (!id.startsWith(ctx.reactRouterConfig.appDirectory)) {
        return;
      }

      if (pluginConfig.outDir && id === join(rootDirectory, pluginConfig.outDir, TYPE_FILE_NAME)) {
        return;
      }

      await reloadCtx();
      generateTypeFile();
    },
  };
}
