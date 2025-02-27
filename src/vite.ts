import replace from '@rollup/plugin-replace';
import * as Vite from 'vite';
import { join } from 'node:path';
import { placeholder } from './basename.js';
import { DEFAULT_OUTPUT_DIR_PATH, build } from './build.js';
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
    const config = await reactRouterPlugin.config(viteUserConfig, { ...viteConfigEnv, command: 'build' });
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
      reactRouterPlugin = config.plugins.find((plugin) => plugin.name === 'react-router');
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

      await reloadCtx();
      generateTypeFile();
    },
  };
}
