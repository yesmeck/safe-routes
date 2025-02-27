interface Context {
  strict?: boolean;
  relativeAppDirPath: string;
  routeIds: string[];
  routes: Array<{
    route: string;
    params: string[];
    fileName: string;
  }>,
}

function indent(n: number) {
  return '  '.repeat(n);
}

function exportedQuery(ctx: Context) {
  if (ctx.strict) {
    return `type ExportedQuery<T> = IsSearchParams<T> extends true ? T : never;`;
  }
  return `type ExportedQuery<T> = IsSearchParams<T> extends true ? T : URLSearchParamsInit;`;
}

function routes(ctx: Context) {
  const routes = ctx.routes.map(({ route, params, fileName }) =>
    `"${route}": {
      params: ${params.length > 0 ? `{${params.map(param => `${param}: string | number`).join('; ')}}` : 'never'},
      query: ExportedQuery<import('${ctx.relativeAppDirPath}/${fileName}').SearchParams>,
    }`
  );

  return `export interface Routes {
    ${routes.join(',\n' + indent(2))}
  }`
}

function routeIds(ctx: Context) {
  return `export type RouteId =
            | ${ctx.routeIds.map(routeId => `'${routeId}'`).join(`\n${indent(6)}| `)};`;
}

export function template(ctx: Context) {
  return `declare module "safe-routes" {
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

  ${routeIds(ctx)}

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

  export function $routeId(routeId: RouteId): RouteId;
}`;
};
