# Execution plans for AI/human implementation

Create an execution plan for work that spans several subsystems, changes persistence schema, affects privacy/media rights, introduces native build/deployment, or cannot be reliably finished/reviewed as a single small change. Follow [../AI-WORKFLOW.md](../AI-WORKFLOW.md).

## Structure and lifecycle

- New scoped plan: copy [TEMPLATE.md](TEMPLATE.md) into `docs/exec-plans/active/YYYY-MM-DD-short-task.md`. The `active/` folder is created by the first such task; no empty placeholder is required.
- Update **after actual steps**, including working commit/PR links, precise executed tests, failures, decision changes and remaining risks. A speculative checklist is not progress.
- Once done or superseded, move the plan to `docs/exec-plans/completed/` and document outcomes/limitations; commit that status change with the closing PR.
- Avoid duplicate plans for the same gate; link [roadmap G0–G6](../25-implementation-vertical-slice-roadmap.md), [architecture C-01…C-10](../27-stack-architecture-compatibility-and-implementation-gates.md) and existing PRs.

## Rules

A plan is an execution record, **not** permission to invent tool outputs or test outcomes. At every milestone distinguish `PLANNED`, `IN_PROGRESS`, `DONE_TESTED`, `BLOCKED`. Never state Android compiled or web parity done without actual corresponding evidence. Keep plans short and actionable; link ADRs rather than copying them.
