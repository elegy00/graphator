import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    define: {
      'process.env.HA_AUTH_TOKEN': JSON.stringify(env.HA_AUTH_TOKEN),
      'process.env.HA_URL': JSON.stringify(env.HA_URL),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
