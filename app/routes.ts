import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/sensordata/:sensorId", "routes/api.sensordata.$sensorId.ts"),
] satisfies RouteConfig;
