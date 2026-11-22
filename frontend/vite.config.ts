import { protectBookingSelection } from "./tools/client-protection.mjs";
import { defineConfig, type Plugin } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.ROOMBOOK_UI_PORT || "5173");
const target = process.env.ROOMBOOK_API_TARGET || "http://127.0.0.1:3000";
const api = new URL(target);
if (!Number.isInteger(port) || port < 1 || port > 65535 ||
    api.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(api.hostname) ||
    api.username || api.password || api.pathname !== "/" || api.search || api.hash) {
  throw new Error("Invalid local frontend preview configuration.");
}

// Keep the initial UI small while allowing the intentionally deferred wordlists.
const bundleBudget: Plugin = {
  name: "roombook-bundle-budget",
  generateBundle(_options, bundle) {
    for (const output of Object.values(bundle)) {
      if (output.type === "chunk") {
        const bytes = new TextEncoder().encode(output.code).byteLength;
        const limit = output.isEntry ? 250_000 :
          output.name === "PasswordStrengthEstimator" ? 1_800_000 : 500_000;
        if (bytes > limit) this.error("RoomBook JavaScript bundle budget exceeded: " + output.fileName);
      }
      if (output.type === "asset" && output.fileName.endsWith(".css")) {
        const bytes = typeof output.source === "string" ?
          new TextEncoder().encode(output.source).byteLength : output.source.byteLength;
        if (bytes > 35_000) this.error("RoomBook stylesheet budget exceeded.");
      }
    }
  },
};

export default defineConfig({
  root,
  appType: "spa",
  plugins: [bundleBudget, { name: "roombook-client-protection", apply: "build", enforce: "pre", transform(source, id) { if (id.replaceAll("\\", "/").endsWith("/Domain/Booking/Service/BookingSelectionService.ts")) return { code: protectBookingSelection(source, id), map: null }; return null; } }],
  resolve: {
    alias: {
      "#ui-domain": fileURLToPath(new URL("./src/Domain", import.meta.url)),
      "#ui-application": fileURLToPath(new URL("./src/Application", import.meta.url)),
      "#ui-infrastructure": fileURLToPath(new URL("./src/Infrastructure", import.meta.url)),
      "#ui-entrypoint": fileURLToPath(new URL("./src/EntryPoint", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
    cors: false,
    fs: {
      strict: true,
      allow: [root],
      deny: [".env", ".env.*", "**/.env*", "**/*.{pem,key,crt}", "**/.git/**", "**/*.map"],
    },
    proxy: { "/api": { target, changeOrigin: false } },
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; font-src 'self'; connect-src 'self' ws://127.0.0.1:" + port +
        " http://127.0.0.1:3000; frame-ancestors 'none'; base-uri 'self'; " +
        "form-action 'self'; object-src 'none'",
    },
  },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { sourcemap: false, outDir: "dist", chunkSizeWarningLimit: 1800 },
});
