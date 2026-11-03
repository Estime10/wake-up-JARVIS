import { describe, expect, it } from "vitest";

import {
  assertBodyByteLength,
  getPiperUpstreamUrl,
  isPiperProxyEnabled,
} from "@/adapters/piper/piperProxyConfig";

describe("piperProxyConfig", () => {
  it("autorise uniquement le loopback", () => {
    expect(
      getPiperUpstreamUrl({ PIPER_HTTP_URL: "http://127.0.0.1:5000" }),
    ).toBe("http://127.0.0.1:5000");
    expect(() =>
      getPiperUpstreamUrl({ PIPER_HTTP_URL: "http://8.8.8.8:5000" }),
    ).toThrow("piper_url_not_loopback");
  });

  it("refuse les corps trop gros", () => {
    expect(() => assertBodyByteLength(4097)).toThrow("piper_body_too_large");
    expect(() => assertBodyByteLength(100)).not.toThrow();
  });

  it("est actif en non-production par défaut", () => {
    expect(isPiperProxyEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isPiperProxyEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isPiperProxyEnabled({ NODE_ENV: "production", PIPER_PROXY_ENABLED: "1" }),
    ).toBe(true);
  });
});
