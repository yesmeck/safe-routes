export const placeholder = "__safe_routes_" + "basename__";

const basename = "__safe_routes_basename__";

export function resolveBasename(): string {
  if (basename && basename !== placeholder) {
    return basename;
  }
  return "";
}
