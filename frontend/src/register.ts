// Custom element registration that survives HA replacing window.customElements — see
// docs/card.md#registry-patching

// How long a host waits for its lazily loaded implementation tag before showing the load notice.
export const REGISTRATION_TIMEOUT_MS = 2000;

// Fallback poll for a swap not signalled by <home-assistant> — see docs/card.md#registry-patching
const SWAP_POLL_MS = 250;
const SWAP_POLL_LIMIT_MS = 30_000;

export type RegistryEntries = readonly (readonly [string, CustomElementConstructor])[];

export interface RegisterOptions {
  onAllResolved?: () => void;
}

// Idempotent: a define that throws because the tag already landed counts as success.
export function defineAll(
  registry: CustomElementRegistry,
  entries: RegistryEntries,
  options: RegisterOptions = {},
): boolean {
  for (const [tag, ctor] of entries) {
    if (registry.get(tag)) {
      continue;
    }
    try {
      registry.define(tag, ctor);
    } catch {
      // Defined concurrently by another copy of this bundle — the check below decides.
    }
  }
  const all = entries.every(([tag]) => registry.get(tag) !== undefined);
  if (all) {
    options.onAllResolved?.();
  }
  return all;
}

// HA's app.js replaces window.customElements after we may have defined — see docs/card.md#registry-patching
export function defineWithSwapGuard(entries: RegistryEntries, options: RegisterOptions = {}): void {
  let registry = window.customElements;
  defineAll(registry, entries, options);

  const redefineIfSwapped = (): boolean => {
    const current = window.customElements;
    if (current === registry) {
      return false;
    }
    registry = current;
    defineAll(current, entries, options);
    return true;
  };

  // Resolves once HA's app has evaluated, so the registry is final — see docs/card.md#registry-patching
  void registry.whenDefined("home-assistant").then(redefineIfSwapped);

  const started = Date.now();
  const poll = (): void => {
    if (redefineIfSwapped() || Date.now() - started > SWAP_POLL_LIMIT_MS) {
      return;
    }
    setTimeout(poll, SWAP_POLL_MS);
  };
  setTimeout(poll, SWAP_POLL_MS);
}
