# Feature Branch Merge Plan

This document outlines a recommended order for merging the open feature branches into `main` to minimize and manage merge conflicts effectively.

**General Recommendations:**

*   **Dedicated Integration Branch:** Before starting, create a new branch from the latest `main` (e.g., `integration- प्रयास`). Perform all merges into this branch. Once all features are integrated and tested, this branch can be merged into `main`.
*   **One at a Time:** Merge one feature branch (or a very small, directly related group) at a time.
*   **Resolve Conflicts Carefully:** When conflicts arise, take the time to understand the changes from both the integration branch and the feature branch to ensure no functionality is lost.
*   **Test Thoroughly:** After each successful merge, run all automated tests. Perform manual smoke testing for the areas affected by the merged feature.
*   **Communication:** If multiple people are involved, maintain clear communication about who is merging what and any issues encountered.
*   **`git rebase` (Use with Caution):** For very small, clean feature branches with a linear history, rebasing onto the integration branch *before* merging can lead to a cleaner `main` history. However, for complex branches or those with many existing commits, a standard merge (`git merge --no-ff <branch-name>`) is often safer and provides a clearer record of the merge.
*   **Branch Currency Check:** Before merging a branch, quickly verify it represents the latest intended changes for that feature, especially if multiple PRs/branches might have addressed the same issue.

**Branch Aliases Used:**

*   **LeaderboardColumnFix**: `origin/4k7oc3-codex/update-column-names-in-model-quality-leaderboard`
*   **SignupURLFix**: `origin/gdz53t-codex/modify-signup-to-use-same-baseurl-as-signin` (Likely PR #52)
*   **ActivityLogAuth**: `origin/codex/add-activity-log-and-session-conversion-on-auth`
*   **MoreAPIRoutes**: `origin/codex/add-api-routes-for-sessions,-activity-log,-feedback`
*   **AuthGuards**: `origin/codex/add-authentication-guards-and-redirects`
*   **UserEvents**: `origin/codex/add-user_events-table-and-event-tracking`
*   **SpeedModeScores**: `origin/codex/create-migration-and-api-for-speed_mode_scores`
*   **PageViews**: `origin/codex/create-page_views-table-and-api-endpoint`
*   **UserPerfChartSpeed**: `origin/codex/extend-userperformancecharts-to-show-speed-scores`
*   **AnonSession**: `origin/codex/implement-anonymous-session-handling`
*   **SupabaseAuth**: `origin/codex/implement-sign-in/sign-up-with-supabase`
*   **SpeedLeaderboard**: `origin/codex/implement-speed-mode-leaderboard-api-and-ui`
*   **SpeedArena**: `origin/codex/implement-speedmodearena-and-page`
*   **LogEvalActivity**: `origin/codex/log-evaluation-activity-and-increment-count`
*   **EvalSaveLogic**: `origin/codex/modify-model-evaluation-saving-logic`
*   **SentenceBoundaries**: `origin/codex/update-api-to-handle-sentence-boundaries`
*   **EvalSaveLeaderboard**: `origin/codex/update-evaluation-saving-logic-and-leaderboard`
*   **ScrollHandler**: `origin/codex/update-scroll-handler-in-textpane`

---

## Merge Order and Tips

### Phase 1: Foundational & Isolated Changes

1.  **Branch:** `ScrollHandler`
    *   **Purpose:** Updates scroll handling in `TextPane`.
    *   **Files Changed:** `src/components/TextPane.tsx`, `test/textPaneScroll.test.js`
    *   **Tips:** Low conflict risk. Good first merge.

2.  **Branch:** `PageViews`
    *   **Purpose:** Adds database table and API for logging page views.
    *   **Files Changed:** `migrations/20240608_create_page_views.sql`, `src/app/api/log-page-view/route.ts`, `src/app/layout.tsx`, `src/components/PageViewLogger.tsx`
    *   **Tips:** Self-contained feature. Low conflict risk.

3.  **Branch:** `LeaderboardColumnFix`
    *   **Purpose:** Fixes column names in the model quality leaderboard.
    *   **Files Changed:** `src/app/api/model-quality-leaderboard/route.ts`, `test/api-routes.test.js`, `test/model-quality-leaderboard.test.js`
    *   **Tips:** `test/api-routes.test.js` is a common point of conflict. Merging this early helps establish a baseline.
        *   Note: `origin/codex/update-column-names-in-model-quality-leaderboard` was identified as a duplicate. This one is preferred due to commit message. Ensure all necessary changes from both are captured if there are subtle differences.

4.  **Branch:** `SentenceBoundaries`
    *   **Purpose:** Updates API to handle sentence boundaries, includes package updates.
    *   **Files Changed:** `package-lock.json`, `package.json`, `src/app/api/generate-live-comparison/route.ts`, `src/app/api/generate-openai/route.ts`, `src/app/api/human-model-evaluations/route.ts`, `src/lib/utils.ts`, `src/types/openai.d.ts`, various test files.
    *   **Tips:** Check package updates for compatibility.
        *   **Critical Path:** This branch modifies `src/types/openai.d.ts`. The later `AuthGuards` branch modifies `src/openai.d.ts`. Decide on the canonical path (likely `src/types/openai.d.ts`) and ensure changes from both branches are correctly consolidated into the chosen file when `AuthGuards` is merged.

5.  **Branch:** `UserEvents`
    *   **Purpose:** Adds database table and API for user event tracking.
    *   **Files Changed:** `migrations/20240610_add_user_events.sql`, `src/app/api/log-event/route.ts`, `src/app/dataset/page.tsx`, `src/app/resources/page.tsx`, `src/components/ModelEvaluationArena.tsx`, `src/components/NavigationBar.tsx`, `src/lib/eventLogger.ts`, `test/api-routes.test.js`.
    *   **Tips:** First merge to touch `ModelEvaluationArena.tsx` and adds more to `test/api-routes.test.js`.

### Phase 2: Speed Mode Features

6.  **Branch:** `SpeedModeScores`
    *   **Purpose:** Core database migration and API for speed mode scores.
    *   **Files Changed:** `migrations/20240608_add_speed_mode_scores.sql`, `src/app/api/speed-mode/route.ts`, `test/speed-mode.test.js`.
    *   **Tips:** Foundational for other speed mode features.

7.  **Branch:** `SpeedArena`
    *   **Purpose:** UI and page for the Speed Mode Arena.
    *   **Files Changed:** `src/app/api/speed-mode/route.ts`, `src/app/human-machine/speed/page.tsx`, `src/components/SpeedModeArena.tsx`.
    *   **Tips:** Expect changes to `api/speed-mode/route.ts` to be additive if `SpeedModeScores` is merged first.

8.  **Branch:** `SpeedLeaderboard`
    *   **Purpose:** API and UI for the Speed Mode Leaderboard.
    *   **Files Changed:** `src/app/api/speed-mode-leaderboard/route.ts`, `src/app/leaderboard/page.tsx`, `src/lib/leaderboard.ts`, `test/speed-mode-leaderboard.test.js`.
    *   **Tips:** Relies on speed mode data structures.

9.  **Branch:** `UserPerfChartSpeed`
    *   **Purpose:** Updates user performance charts to include speed scores.
    *   **Files Changed:** `src/components/UserPerformanceCharts.tsx`.
    *   **Tips:** Relatively isolated UI change related to speed mode.

### Phase 3: Authentication & User Context (High Conflict Zone)

*General Tip for this Phase: `src/contexts/UserContext.tsx` is a major conflict point. Merge carefully.*

10. **Branch:** `SignupURLFix` (PR #52)
    *   **Purpose:** Fixes signup redirect URL logic.
    *   **Files Changed:** `src/contexts/UserContext.tsx`.
    *   **Tips:** This is a small, targeted change to `UserContext.tsx`. Merging it first helps establish a slightly updated baseline for this critical file.
        *   Note: `origin/codex/modify-signup-to-use-same-baseurl-as-signin` was identified as superseded by this branch.

11. **Branch:** `SupabaseAuth`
    *   **Purpose:** Implements core sign-in/sign-up with Supabase.
    *   **Files Changed:** `.env.example`, `README.md`, `src/app/api/human-model-evaluations/route.ts`, `src/app/api/model-leaderboard/route.ts`, `src/app/auth/login/page.tsx`, `src/app/auth/reset/page.tsx`, `src/app/auth/signup/page.tsx`, `src/components/LoginForm.tsx`, `src/components/SignupForm.tsx`, `src/contexts/UserContext.tsx`, various test files.
    *   **Tips:** This is a large and foundational authentication branch. Expect significant conflicts in `UserContext.tsx` (with `SignupURLFix`) and test files (e.g., `test/api-routes.test.js`, `test/model-leaderboard.test.js`).

12. **Branch:** `AuthGuards`
    *   **Purpose:** Adds authentication guards and redirects for various pages/components.
    *   **Files Changed:** `middleware.ts`, `src/app/auth/callback/route.ts`, `src/app/login/page.tsx`, `src/components/HumanEvaluationArena.tsx`, `src/components/HumanMachineArena.tsx`, `src/components/ModelEvaluationArena.tsx`, `src/components/UserProfileButton.tsx`, `src/contexts/UserContext.tsx`, `src/openai.d.ts`, test files.
    *   **Tips:** Heavily impacts UI components and `UserContext.tsx`.
        *   **Resolve `openai.d.ts` vs `types/openai.d.ts` here**: Ensure changes from this branch's `src/openai.d.ts` and `SentenceBoundaries`' `src/types/openai.d.ts` are consolidated into the single chosen canonical file.
        *   Conflicts expected with `SupabaseAuth` in `UserContext.tsx` and auth-related pages/components.
        *   Also conflicts with `UserEvents` and `AnonSession` (later) in `ModelEvaluationArena.tsx`.

13. **Branch:** `ActivityLogAuth`
    *   **Purpose:** Links activity logging to the authentication system and session conversion.
    *   **Files Changed:** `src/app/api/activity-log/route.ts`, `src/app/api/anonymous-session/route.ts`, `src/contexts/UserContext.tsx`.
    *   **Tips:** Depends on `UserContext.tsx` changes from previous auth merges.

14. **Branch:** `MoreAPIRoutes`
    *   **Purpose:** Adds more API routes for sessions, activity log, and feedback.
    *   **Files Changed:** `src/app/api/activity-log/route.ts`, `src/app/api/anonymous-session/route.ts`, `src/app/api/experience-feedback/route.ts`.
    *   **Tips:** Extends APIs from `ActivityLogAuth`. Conflicts in `activity-log` and `anonymous-session` routes are expected; changes should generally be additive.

15. **Branch:** `AnonSession`
    *   **Purpose:** Implements handling for anonymous user sessions.
    *   **Files Changed:** `src/app/api/anonymous-session/route.ts`, `src/components/ModelEvaluationArena.tsx`, `src/lib/anonymousSession.ts`, `test/anonymous-session.test.js`.
    *   **Tips:** Conflicts with `ActivityLogAuth`/`MoreAPIRoutes` in `api/anonymous-session/route.ts`. Conflicts with `AuthGuards`/`UserEvents` in `ModelEvaluationArena.tsx`.

16. **Branch:** `LogEvalActivity`
    *   **Purpose:** Adds more specific logging for evaluation activities.
    *   **Files Changed:** `src/app/api/activity-log/route.ts`, `src/components/HumanEvaluationArena.tsx`, `src/components/ModelEvaluationArena.tsx`, `src/lib/anonymousSession.ts`.
    *   **Tips:** High potential for conflicts.
        *   `api/activity-log/route.ts`: Conflicts with `ActivityLogAuth`/`MoreAPIRoutes`.
        *   Arena components: Conflicts with `AuthGuards`, `UserEvents`, `AnonSession`.
        *   `lib/anonymousSession.ts`: Conflicts with `AnonSession`.

### Phase 4: Core Evaluation Logic & Leaderboards (High Conflict Zone)

17. **Branch:** `EvalSaveLogic`
    *   **Purpose:** Modifies logic for saving model evaluations and updating the leaderboard.
    *   **Files Changed:** `src/app/api/model-leaderboard/route.ts`, `test/api-routes.test.js`, `test/model-leaderboard.test.js`.
    *   **Tips:** Conflicts with `SupabaseAuth` and potentially `SentenceBoundaries` in `api/model-leaderboard/route.ts` and related tests.

18. **Branch:** `EvalSaveLeaderboard`
    *   **Purpose:** A broad branch updating evaluation saving logic and various leaderboards.
    *   **Files Changed:** Numerous API routes (`content-report`, `download-dataset`, `generate-live-comparison`, `human-deception-leaderboard`, `human-model-evaluations`, `model-leaderboard`, `model-quality-leaderboard`, `user-dashboard`), `src/app/auth/callback/route.ts`, and `test/api-routes.test.js`, `test/model-leaderboard.test.js`.
    *   **Tips:** This is likely the most complex merge due to its breadth. It will conflict with many previously merged branches:
        *   `LeaderboardColumnFix` (model-quality-leaderboard API)
        *   `SentenceBoundaries` (generate-live-comparison, human-model-evaluations APIs)
        *   `AuthGuards` (auth/callback API)
        *   `SupabaseAuth` (human-model-evaluations, model-leaderboard APIs)
        *   `EvalSaveLogic` (model-leaderboard API)
        *   Test files will have many conflicts.
    *   Merge this last among the feature branches. Ensure all functionalities from previous merges touching these files are preserved.

---

This plan is a guideline. The actual complexity and conflict points may vary. Stay methodical, test frequently, and good luck! 