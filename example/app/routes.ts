import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("posts", "routes/posts/index/route.tsx"),
  route("posts/:id", "routes/posts/show/route.tsx"),
] satisfies RouteConfig;
