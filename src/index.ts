import { resolveBasename } from './basename.js';

function includesParams(route: string) {
  return route.indexOf('/:') > -1 || route.indexOf('/*') > -1;
}

function prependBasename(path: string) {
  const basename = resolveBasename();
  if (!basename) {
    return path;
  }
  return basename + path;
}

export function $path(route: string, ...paramsOrQuery: Array<any>) {
  let path = route;
  let query:
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
    | undefined = paramsOrQuery[0];

  if (includesParams(route)) {
    const params: any = paramsOrQuery[0] ?? {};
    query = paramsOrQuery[1];
    path = route.split('/').map(fragment => {
      if (fragment.indexOf('?') > -1) {
        fragment = fragment.slice(0, -1);
      }
      if (fragment.indexOf(':') > -1) {
        let [paramName, extension] = fragment.slice(1).split('.');
        if (paramName in params && params[paramName] !== undefined) {
          return params[paramName] + (extension ? '.' + extension : '');
        }
        return null
      }
      if (fragment == "*") {
        if ("*" in params) {
          return params["*"];
        }
        return null;
      }
      return fragment;
    }).filter(f => f !== null).join('/');
  }

  if (!query) {
    return prependBasename(path);
  }

  const searchParams = new URLSearchParams(query);


  return prependBasename(path + '?' + searchParams.toString());
}

export function $routeId(routeId: string) {
  return routeId;
}

/** @deprecated Prefer to use React Router's typegen features instead. */
export function $params(
  _route: string,
  params: { readonly [key: string]: string | undefined },
) {
  return params;
}
