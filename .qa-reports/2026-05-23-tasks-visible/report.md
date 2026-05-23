# QA Report: Tasks Visibility And Creation

**Date**: 2026-05-23
**Status**: PASSED

## Test Steps
1. Checked Pol task data with Supabase service role.
2. Verified `/tasks` in the browser through the demo session.
3. Created a task from the UI without manually selecting assignees.
4. Verified the new task appeared immediately and was stored with both legacy `assigned_to` and `task_assignees`.
5. Cleaned up the temporary QA task.
6. Ran `npm run typecheck` and `npm run build`.

## Findings
- Pol has 25 assigned tasks, and all 25 are `done`; the previous UI counted them as pending while hiding them from the list.
- New tasks were not persisted as visible personal tasks because creation did not set `assigned_to` or pass `assigneeIds`.
- The fixed UI counts only visible pending tasks unless completed tasks are enabled.
- A new task created without assignees now defaults to the current user and remains visible after refetch.

## Screenshots
- `screenshots/01-before-tasks.png` - Initial tasks page in demo
- `screenshots/03-created-task-visible.png` - New task visible after creation

## Artifacts
- `browser-before.json` - initial browser capture
- `create-after.json` - creation verification and DB checks
