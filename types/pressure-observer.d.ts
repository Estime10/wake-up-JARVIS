/**
 * Compute Pressure API (Chrome/Edge) — types minimaux pour le HUD SYS.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Compute_Pressure_API
 */

type PressureSource = "cpu";

type PressureState = "nominal" | "fair" | "serious" | "critical";

interface PressureRecord {
  readonly source: PressureSource;
  readonly state: PressureState;
  readonly time: DOMHighResTimeStamp;
}

interface PressureObserverOptions {
  readonly sampleInterval?: number;
}

type PressureUpdateCallback = (
  records: PressureRecord[],
  observer: PressureObserver,
) => void;

declare class PressureObserver {
  constructor(callback: PressureUpdateCallback);
  observe(
    source: PressureSource,
    options?: PressureObserverOptions,
  ): Promise<void>;
  unobserve(source: PressureSource): void;
  disconnect(): void;
  takeRecords(): PressureRecord[];
  static readonly knownSources: ReadonlyArray<PressureSource>;
}

interface Window {
  PressureObserver?: typeof PressureObserver;
}
