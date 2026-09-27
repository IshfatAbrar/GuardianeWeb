import { registerOTel } from "@vercel/otel";

// OpenTelemetry tracing for route handlers, server rendering, and outgoing fetches.
// Export target: on Vercel, whichever OTel integration/drain is set up for the project;
// elsewhere, the OTLP collector in OTEL_EXPORTER_OTLP_ENDPOINT (+ OTEL_EXPORTER_OTLP_HEADERS).
// With neither, spans are dropped.
export function register() {
  registerOTel({ serviceName: "guardiane-web" });
}
