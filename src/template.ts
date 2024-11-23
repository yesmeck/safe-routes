interface Context {
  strict?: boolean;
  relativeAppDirPath: string;
  routes: Array<{
    route: string;
    params: string[];
    fileName: string;
  }>,
  routeIds: string[];
}

export function exportedQuery(ctx: Context) {
  if (ctx.strict) {
    return `type ExportedQuery<T> = IsSearchParams<T> extends true ? T : never;`;
  }
  return `type ExportedQuery<T> = IsSearchParams<T> extends true ? T : URLSearchParamsInit;`;
}

export function routes(ctx: Context) {
  return `export interface Routes {
    ${ctx.routes.map(({ route, params, fileName }) => {
      return `"${route}": {
        params: ${params.length > 0 ? `{${params.map(param => `${param}: string | number`).join('; ')}}` : 'never'},
        query: ExportedQuery<import('${ctx.relativeAppDirPath}/${fileName}').SearchParams>,
      };`
    })}
  }`
}

export function RouteId(ctx: Context) {
  return `export type RouteId = ${ctx.routeIds.join(' | ')};`;
}

export function template(ctx: Context) {
  return `declare module "remix-routes" {
  type URLSearchParamsInit = string | string[][] | Record<string, string> | URLSearchParams;
  // symbol won't be a key of SearchParams
  type IsSearchParams<T> = symbol extends keyof T ? false : true;
  ${exportedQuery(ctx)}
  ${routes(ctx)}

  type RoutesWithParams = Pick<
    Routes,
    {
      [K in keyof Routes]: Routes[K]["params"] extends Record<string, never> ? never : K
    }[keyof Routes]
  >;

  ${RouteId(ctx)}

  export function $path<
    Route extends keyof Routes,
    Rest extends {
      params: Routes[Route]["params"];
      query?: Routes[Route]["query"];
    }
  >(
    ...args: Rest["params"] extends Record<string, never>
      ? [route: Route, query?: Rest["query"]]
      : [route: Route, params: Rest["params"], query?: Rest["query"]]
  ): string;

  export function $params<
    Route extends keyof RoutesWithParams,
    Params extends RoutesWithParams[Route]["params"]
  >(
      route: Route,
      params: { readonly [key: string]: string | undefined }
  ): {[K in keyof Params]: string};

  export function $routeId(routeId: RouteId): RouteId;
}`;
};
