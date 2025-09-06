# TODO / Technical Debt & Improvement Plan

This document captures the current assessment of `src/plugin` (Pinia persistence plugin) and a prioritized plan for improvements.

---
## 1. Major Issues & Risks (Current State)
1. Unused / Inconsistent Type Augmentations
   - `paths`, `serialize`, `deserialize`, `getters`, `actions`, `key` declared but not implemented.
2. Misapplied `beforeHydrate`
   - Declared per bucket but only read at top-level and executed before persisting (not really "before hydrate"). Incorrect parameter (store vs raw state snapshot).
3. Hydration Ordering & Multi-Bucket Overwrites
   - Each bucket hydrates + immediately re-persists → later buckets can override prior keys; writes happen before all buckets loaded (race potential across tabs).
4. External Change Sync Missing
   - Adapters expose `subscribe` (localStorage, indexedDB) but plugin never uses them; no cross-tab/state sync after initial load.
5. No Safe JSON Parsing
   - Missing try/catch around `JSON.parse`; malformed data can break init.
6. Include / Exclude Handling
   - Runtime throw if both provided; could be enforced at type level. Only shallow top-level keys; no nested paths. Undocumented limitation.
7. Performance / Write Amplification
   - Entire (partial) state JSON-stringified on every mutation. Single global debounce only (not per bucket). No diffing.
8. Key Namespacing & Versioning
   - Plain `store.$id` key reused by all buckets; no prefix, version, or migration path.
9. Reset / Deletion Handling
    - No clearing of persisted state on `$reset` / store removal.
10. Async Plugin Return
    - `createPiniaPluginStorage` is `async`; potential mismatch with Pinia expectations and hydration timing flicker (SSR risk).
11. SSR / Non-Browser Context
    - No early return in server context; unnecessary async operations attempted.
12. IndexedDB Robustness
    - Swallows errors (`catch {}`); no visibility, no singleton reuse plan; channel per adapter instantiation.
13. Cookie Adapter Limitations
    - No size warnings; default SameSite undocumented; no expiration date option (only `maxAgeSeconds`).
14. Silent Failures & Observability
    - Broad silent error suppression; no logging hook.
15. Security / Privacy
    - No redaction, encryption, or transform pipeline; risk of leaking sensitive data.
16. Type Design Weaknesses
    - `adapter?` optional leads to implicit sessionStorage; union doesn’t enforce mutually exclusive include/exclude; adapter key union hand-maintained.
17. Subscription Not Used
    - Missed opportunity for live sync (already built into adapters).
18. Immediate Post-Hydration Write
    - Can overwrite fresher remote data (race before user interaction).
19. No Tests
    - Critical logic (hydration order, corrupt data, multi-bucket merges, debounce) untested.

---
## 2. High-Level Goals
- Deterministic, race-free, observable, test-covered, and extensible persistence layer with clear documented API and predictable lifecycle.

---
## 3. Prioritized Improvement Roadmap
### Phase 1 (Correctness & Safety)
- [x] Centralize bucket resolution; create adapter instances once; cache in map keyed by bucket identity. (Implemented)
- [ ] Collect all bucket payloads first → merge → invoke `beforeHydrate` hook once → single `$patch` → defer first write until after hydration completes.
- [ ] Add safe parse (`try/catch`) with optional `onCorruptData` callback + auto-purge strategy.
- [ ] Enforce mutual exclusion of `include` & `exclude` at type level (`type ExclusiveIncludeExclude = { include: ...; exclude?: never } | { exclude: ...; include?: never } | {}`).
- [ ] Make `adapter` required in `Bucket`; provide top-level `defaultAdapter` fallback.
- [ ] Rename or reposition `beforeHydrate` (true semantics) or add `beforePersist` if both needed.
- [ ] SSR guard (`if (typeof window === 'undefined') return;`).

### Phase 2 (Synchronization & Lifecycle)
- [ ] Implement external subscription: use each adapter's `subscribe` to rehydrate changed keys (diff + patch) without write loops (use change origin token).
- [ ] Add `$reset` interception (via `$onAction`) to clear persisted entry or restore defaults then persist.
- [ ] Support namespaced keys: `${prefix}:${version}:${store.$id}:${bucketName || adapter}`.
- [ ] Add optional `version` + `migrate(storedVersion, data)` function.

### Phase 3 (Performance & Flexibility)
- [ ] Per-bucket `debounceDelayMs`; support `immediate: boolean` for flush mode.
- [ ] Optional diff-based persistence (track previous serialized slice; skip if unchanged).
- [ ] Batch multiple rapid mutations in same microtask with queue + coalesced write.
- [ ] Allow custom `serialize` / `deserialize` (actually implement currently declared API or remove).
- [ ] Provide transform pipeline: `transforms?: Array<{ in: (state) => any; out: (raw) => any }>`.

### Phase 4 (DX & Observability)
- [ ] Add `onError(error, context)` hook (context: adapter, stage, storeId, bucketId).
- [ ] Provide optional dev logging flag.
- [ ] Emit custom events for devtools integration (e.g., hydration complete, persist start/finish, external update).
- [ ] Document each adapter’s caveats (size limits, async characteristics, cross-tab behavior).

### Phase 5 (Adapters & Edge Features)
- [ ] IndexedDB: Singleton per (dbName, storeName). Lazy open on first operation. Surface errors via hook.
- [ ] Cookie adapter: Support `expiresAt: Date`; warn (dev) when exceeding typical size threshold (~4KB total per cookie).
- [ ] Add memory adapter (for tests / fallback) & optional secure adapter wrapper (encryption).

### Phase 6 (Testing)
- [ ] Unit tests: include/exclude resolution; exclusive option validation; error parse recovery.
- [ ] Multi-bucket hydration ordering & non-overwrite merging.
- [ ] External sync (localStorage + BroadcastChannel for IndexedDB) using simulated events.
- [ ] Debounce timing (fake timers) ensures single write.
- [ ] `$reset` clears stored state.
- [ ] Versioned migration logic.
- [ ] SSR no-op behavior.

---
## 4. Data Flow (Target Design)
1. Init: Resolve buckets → build plan (adapter instance, key, selectors).
2. Hydration Stage: Parallel `getItem` → safe parse → selective merge.
3. Pre-Patch Hook: `beforeHydrate?(mergedState, store)` once.
4. Patch: Single `$patch(mergedState)`.
5. Subscriptions: Register store mutation listener (debounced/diffed) + adapter external listeners.
6. Persist: Build partial state (include/exclude) → transform pipeline → serialize → setItem.
7. External Update: Adapter subscription triggers fetch → parse → diff → patch (suppress echo).

---
## 5. Type Revisions (Draft)
```ts
interface BaseBucketCommon {
  name?: string; // optional logical bucket id
  include?: string[];
  exclude?: string[];
  debounceDelayMs?: number;
  transforms?: Array<{ in: (slice: any) => any; out: (raw: any) => any }>; 
}
// Enforce exclusivity via union wrapper later.
interface LocalBucket extends BaseBucketCommon { adapter: 'localStorage' }
interface SessionBucket extends BaseBucketCommon { adapter: 'sessionStorage' }
interface CookieBucket extends BaseBucketCommon { adapter: 'cookies'; options?: CookieOptions }
interface IDBBucket extends BaseBucketCommon { adapter: 'indexedDB'; options: IndexedDBOptions }

export type Bucket = LocalBucket | SessionBucket | CookieBucket | IDBBucket

interface GlobalStorageOptions {
  buckets: Bucket[];
  prefix?: string;
  version?: number;
  migrate?: (storedVersion: number | undefined, data: any) => any;
  beforeHydrate?: (state: any, store: PiniaStore) => void;
  onError?: (err: unknown, ctx: PersistErrorContext) => void;
}
```

---
## 6. Implementation Checklist (Actionable)
- [ ] Refactor types (exclusive include/exclude, required adapter).
- [ ] Introduce key namespace (adapter cache done).
- [ ] Single-pass hydration + unified patch.
- [ ] Correct `beforeHydrate` semantics.
- [ ] Implement serialize/deserialize or remove from augmentation.
- [ ] Add safe parse & corrupt handling.
- [ ] Add adapter subscription handling.
- [ ] Add reset & clear logic.
- [ ] Add per-bucket debounce + diff.
- [ ] Add optional transforms pipeline.
- [ ] Expose error hook & dev logging.
- [ ] SSR guard.
- [ ] Write comprehensive tests.
- [ ] Update README with new API.

---
## 7. Testing Matrix (Summary)
| Area | Test Cases |
|------|------------|
| Hydration | Multi-bucket merge, missing keys, corrupt JSON recovery |
| Include/Exclude | Include only, exclude only, mutual exclusion enforcement |
| Debounce | Burst of 5 mutations -> 1 write |
| External Sync | localStorage event updates store, BroadcastChannel sync across tabs |
| Reset | `$reset` clears persisted data |
| Migration | Old version auto-migrates, unversioned baseline |
| Transforms | In/out functions applied correctly |
| Error Hook | Malformed JSON surfaces via onError |
| SSR | No window -> no adapter calls |

---
## 8. Documentation Updates Needed
- Clarify lifecycle & timing (hydration vs persistence start).
- Explain bucket precedence & merging rules.
- Provide examples for include/exclude, transforms, version migrations.
- State limitations (cookie size, IndexedDB async nature).
- Security considerations & guidance (filter sensitive fields).

---
## 9. Future / Nice-to-Have
- Encryption layer (pluggable codec).
- Devtools panel integration.
- Time-to-live per bucket (auto-expire).
- Selective action-triggered persistence.
- Benchmark script for large states.

---
## 10. Current Status Snapshot
(No refactors applied yet. This document is the authoritative backlog for persistence improvements.)

---
## 11. Quick Win Candidates
- Safe parse + error hook
- Single hydration patch
- Use adapter.subscribe

Implement those first to mitigate most correctness and performance risks.
