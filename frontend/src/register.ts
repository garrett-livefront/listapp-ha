// A wrapped registry can swallow define() silently — verify with get() and retry.
// See docs/card.md#registry-patching
const RETRY_DELAYS_MS = [0, 100, 500];

const WARNING =
  "listapp-list-card: customElements.define did not take. Something on this page is wrapping " +
  "the custom element registry — a scoped custom element registry polyfill, or another frontend " +
  'integration patching customElements. Listapp cards will show "Configuration error" until the ' +
  "page is reloaded; see " +
  "https://github.com/garrett-livefront/listapp-ha/blob/main/docs/card.md#registry-patching";

// How long a host waits for its implementation tag. Independent of, and deliberately longer than,
// the retry chain itself (~600 ms): the chunk's chain may start well after the host began waiting.
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

// HA's app bundle installs @webcomponents/scoped-custom-element-registry as its first import,
// which REPLACES window.customElements with a new, empty registry (it never copies native
// definitions across). index.html dynamic-imports HA's own bundles and every add_extra_js_url
// module concurrently, so this small entry can evaluate before that swap; a define that landed on
// the native registry is then invisible to the replacement's get()/whenDefined(), which is exactly
// what create-element-base.ts consults before showing "Configuration error". Define on whatever
// registry is current now, and define again on the replacement if one appears.
const SWAP_POLL_MS = 250;
const SWAP_POLL_LIMIT_MS = 30_000;

export function defineWithSwapGuard(
  entries: readonly (readonly [string, CustomElementConstructor])[],
  options: RegisterOptions = {},
): void {
  let registry = window.customElements;
  defineWithRetry(registry, entries, options);

  const redefineIfSwapped = (): boolean => {
    const current = window.customElements;
    if (current === registry) {
      return false;
    }
    registry = current;
    defineWithRetry(current, entries, options);
    return true;
  };

  // <home-assistant> is defined by the same bundle, right after the polyfill installs. On the
  // native registry this resolves when the polyfill registers its stand-in for the tag; on the
  // polyfilled one, when HA defines it. Either way: HA's app has evaluated, the registry is final.
  void registry.whenDefined("home-assistant").then(redefineIfSwapped);

  // Belt and braces that doesn't depend on HA's root tag name.
  const started = Date.now();
  const poll = (): void => {
    if (redefineIfSwapped() || Date.now() - started > SWAP_POLL_LIMIT_MS) {
      return;
    }
    setTimeout(poll, SWAP_POLL_MS);
  };
  setTimeout(poll, SWAP_POLL_MS);
}
