// A wrapped registry can swallow define() silently — verify with get() and retry.
// See docs/card.md#registry-patching
const RETRY_DELAYS_MS = [0, 100, 500];

const WARNING =
  "listapp-list-card: customElements.define did not take. Something on this page is wrapping " +
  "the custom element registry — a scoped custom element registry polyfill, or another frontend " +
  'integration patching customElements. Listapp cards will show "Configuration error" until the ' +
  "page is reloaded; see " +
  "https://github.com/garrett-livefront/listapp-ha/blob/main/docs/card.md#registry-patching";

// The total time the retry chain can span, so a late-defining tag has a bounded wait to hang on.
export const REGISTRATION_TIMEOUT_MS = 2000;

let warned = false;

export function warnRegistryWrapped(): void {
  if (warned) {
    return;
  }
  warned = true;
  console.warn(WARNING);
}

// Exported for tests, which need each case to start from a clean single-warning budget.
export function resetRegistrationWarning(): void {
  warned = false;
}

function defineVerified(
  registry: CustomElementRegistry,
  tag: string,
  ctor: CustomElementConstructor,
): boolean {
  if (registry.get(tag)) {
    return true;
  }
  try {
    registry.define(tag, ctor);
  } catch {
    // A concurrent definition of the same tag is a success, not a failure — the check below decides.
  }
  return registry.get(tag) !== undefined;
}

export interface RegisterOptions {
  onAllResolved?: () => void;
  onExhausted?: () => void;
}

export function defineWithRetry(
  registry: CustomElementRegistry,
  entries: readonly (readonly [string, CustomElementConstructor])[],
  options: RegisterOptions = {},
  attempt = 0,
): void {
  // map, not every: every short-circuits, which would leave the second tag unattempted for as
  // long as the first keeps failing. Already-resolved tags short-circuit inside defineVerified,
  // so a retry never re-defines one.
  const results = entries.map(([tag, ctor]) => defineVerified(registry, tag, ctor));
  if (results.every(Boolean)) {
    options.onAllResolved?.();
    return;
  }
  if (attempt > RETRY_DELAYS_MS.length) {
    (options.onExhausted ?? warnRegistryWrapped)();
    return;
  }
  if (attempt === 0) {
    queueMicrotask(() => defineWithRetry(registry, entries, options, 1));
    return;
  }
  setTimeout(
    () => defineWithRetry(registry, entries, options, attempt + 1),
    RETRY_DELAYS_MS[attempt - 1],
  );
}
