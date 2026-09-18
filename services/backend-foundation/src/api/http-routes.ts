export interface RouteDefinition {
  method: string;
  path: string;
}

export const backendRoutes: RouteDefinition[] = [
  { method: "POST", path: "/workspace" },
  { method: "POST", path: "/mission" },
  { method: "POST", path: "/execution" },
  { method: "GET", path: "/execution/:id" },
];
