import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sensor/:location", "routes/sensor.$location.tsx"),
  route("api/sensordata/:sensorId", "routes/api.sensordata.$sensorId.ts"),
] satisfies RouteConfig;
