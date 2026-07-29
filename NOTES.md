# Notes

A registry of deliberate deviations from the default approach used in this service. Each entry is a reusable reason: if a new case falls under an already-described reason, the same ID from this file is used instead of adding a new one with the same substance under a different wording.

> This file does not track where each ID is used - that's `grep`'s job, not the document's. Only the reason itself is recorded here.

Marker in code: `// NOTE[TAG-ID]: see NOTES.md#TAG-ID`.

----

<details>
<summary><strong>SQL</strong></summary>

Deviations from building queries through mikro-orm (ORM / Entity QB) in favor of knex as a plain SQL compiler. knex is used exclusively to build `{sql, bindings}` via `.toSQL()` - no connection of its own, no integration into mikro-orm. Execution always goes through `EntityManager.execute()`; the transaction context is owned by mikro-orm.

#### SQL-01

A `LEFT JOIN LATERAL` whose subquery is the join source itself and must reference a column from the preceding `FROM`/`JOIN` item (a per-row correlated derived table, not just an ON-condition). Neither Entity QB nor `NativeQueryBuilder` expose a lateral join construct - `.join()` only accepts a table/relation or a subquery independent of the outer row.

</details>

----
