# Architecture rules
- Partner commission overrides are stored in private per-product pricing and changed by an admin-only atomic RPC; base-price recalculation preserves overrides and historical sale snapshots.
- Public partner routes resolve brand-name slugs through the approved-only brand directory and redirect legacy ID URLs; this keeps private application data inaccessible and old links usable.
- Use the generated Lovable Cloud client for application queries and additive tool-applied SQL migrations for schema changes; generated integration files are not hand-edited.
- Product size charts are per-product JSON with named measurement columns and per-size stock; shared editor and sizing helpers keep admin, partner, and shopping behavior consistent.
- Cart lines are keyed by product ID plus selected size, and orders store size and measurement snapshots so subsequent chart changes do not alter purchased selections.
- Reserve and restore size inventory inside locked database triggers with transaction-scoped internal updates, preserving partner approval status during inventory changes.
- Retrieve customer receipts and partner payment summaries through ownership-checked functions rather than widening access to private order records.
- Product payment methods are admin-controlled database fields; checkout intersects live product permissions and database triggers reject incompatible order methods to prevent client-side bypasses.
