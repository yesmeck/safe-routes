
import { type Preset } from '@react-router/dev/config';

export type ResolvedReactRouterConfig = Parameters<Required<Preset>['reactRouterConfigResolved']>[number]['reactRouterConfig'];
export type RequiredReactRouterConfig = Pick<ResolvedReactRouterConfig, 'appDirectory' | 'routes'>;
export type RouteManifestEntry = RequiredReactRouterConfig['routes'][string];
export type ReactRouterPluginContext = {
  reactRouterConfig: ResolvedReactRouterConfig;
}
