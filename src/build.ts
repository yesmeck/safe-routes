import * as fs from 'fs';
import { mkdirp } from 'mkdirp';
import * as path from 'path';
import slash from 'slash';
import { template } from './template.js';
import type { RequiredReactRouterConfig, RouteManifestEntry } from './types.js';

interface Options {
  strict?: boolean;
  outputDirPath: string;
}

type RoutesInfo = Record<string, {
  id: string;
  fileName: string;
  params: string[];
}>

export const DEFAULT_OUTPUT_DIR_PATH = './.react-router/types'

async function buildHelpers(config: RequiredReactRouterConfig): Promise<RoutesInfo> {
  const routesInfo: RoutesInfo = {};
  const handleRoutesRecursive = (
    parentId?: string,
    parentPath: RouteManifestEntry[] = [],
  ) => {
    let routes = Object.values(config.routes).filter(
      (route) => route.parentId === parentId,
    );
    routes.forEach((route) => {
      let currentPath = parentPath;
      if (route.id === 'root') {
        routesInfo['/'] = {
          id: route.id,
          fileName: route.file,
          params: [],
        };
      } else {
        currentPath = [...currentPath, route];
        const fullPath = dedupPrefixSlash(currentPath.reduce(
          (acc, curr) => [acc, trimSlash(curr.path)].filter(p => p != undefined).join('/'),
          '',
        ));
        const paramsNames = parse(currentPath);
        // Expand out the paths into all of the possible variants, taking into
        // account optional segments that aren't params/dynamic.
        for (const pathVariant of expandOptionalStaticSegments(fullPath)) {
          routesInfo[pathVariant] = {
            id: route.id,
            fileName: route.file,
            params: paramsNames
          };
        }
      }
      handleRoutesRecursive(route.id, currentPath);
    });
  };
  handleRoutesRecursive();
  return routesInfo;
}

function expandOptionalStaticSegments(path: string) {
  // Split the path at the point where `/` is the next char (positive lookahead regex)
  const segments = path.split(/(?=\/)/g);
  // This turns '/foo/bar' -> ['/foo', '/bar']
  let paths = [''];
  for (const e of segments) {
    if (!e.endsWith('?') || e.startsWith('/:')) {
      // If a given segment is not optional or dynamic, then we just append it to
      // each path variant we have so far: ['/foo'] => ['/foo/bar']
      paths = paths.map((p) => p + e);
    } else {
      // If a given segment is optional, we append a copy of the existing paths
      // with the optional segment appended:
      // ['/foo'] => ['/foo', '/foo/bar']
      paths.push(...paths.map((p) => p + e.slice(0, -1)));
    }
  }
  return paths;
}

export async function build(root: string, config: RequiredReactRouterConfig, options: Options) {
  const routesInfo = await buildHelpers(config);
  generate(root, config, routesInfo, options);
}

function generate(root: string, config: RequiredReactRouterConfig, routesInfo: RoutesInfo, options: Options) {
  const outputPath = path.join(
    root,
    options.outputDirPath,
  );
  const relativeAppDirPath = slash(path.relative(outputPath, config.appDirectory));
  const tsCode = template({
    strict: options.strict,
    relativeAppDirPath,
    routes: Object.entries(routesInfo).map(([route, { id, fileName, params }]) => ({
      id,
      route,
      params,
      fileName: slash(fileName.replace(/\.tsx?$/, '')),
    })).sort((a, b) => a.route.localeCompare(b.route)),
  });

  if (!fs.existsSync(outputPath)) {
    mkdirp.sync(outputPath);
  }
  fs.writeFileSync(path.join(outputPath, 'safe-routes.d.ts'), tsCode);
}

function parse(routes: RouteManifestEntry[]) {
  const paramNames: string[] = [];
  routes.forEach((route) => {
    return (
      route.path &&
      paramNames.push(
        ...route.path
          .split('/')
          .filter((seg) => seg.startsWith(':') || seg == '*')
          .map((param) => param.split('.')[0])
          .map((param) => param.replace(':', '').replace('*', '"*"')),
      )
    );
  });
  return paramNames;
}

function dedupPrefixSlash(path: string) {
  return path.replace(/^\/+/, '/');
}

function trimSlash(path?: string) {
  if (!path) return path;
  return path.replace(/\/+$/, '');
}
