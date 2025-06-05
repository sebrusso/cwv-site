# Testing Branch Integration Plan

## Overview
This plan outlines the strategy for creating a comprehensive testing branch that incorporates all remaining open feature branches while avoiding redundant merges of already-integrated features.

## Pre-Integration Status ✅

### Already Merged to Main (Redundant PRs)
The following features have been successfully merged to `main` in recent commits and should **NOT** be re-merged:

- ScrollHandler (TextPane scroll improvements)
- PageViews (Page view logging)
- LeaderboardColumnFix (Model quality leaderboard columns)
- UserEvents (Event tracking system)
- SpeedModeScores (Speed mode scoring foundation)
- SpeedArena (Speed mode competition UI)
- UserPerfChartSpeed (Speed score charts)
- LogEvalActivity (Evaluation activity logging)
- AnonymousSession (Anonymous session handling)
- ActivityLogAuth (Activity logging with auth)

## Testing Branch Strategy

### Phase 1: Create Testing Branch
```bash
# Create new testing branch from latest main
git checkout main
git pull origin main
git checkout -b testing-integration-v2
git push -u origin testing-integration-v2
```

### Phase 2: Merge Remaining Features (Priority Order)

#### Tier 1: Critical Authentication & Infrastructure
**Order:** These must be merged first as they affect core functionality

1. **SentenceBoundaries** - `origin/codex/update-api-to-handle-sentence-boundaries`
   - **Risk Level:** Medium (package updates, API changes)
   - **Dependencies:** None
   - **Conflicts Expected:** Package files, API routes
   - **Files:** `package.json`, `src/app/api/generate-*`, `src/types/openai.d.ts`

2. **SupabaseAuth** - `origin/codex/implement-sign-in/sign-up-with-supabase`
   - **Risk Level:** High (core auth system)
   - **Dependencies:** SentenceBoundaries (for clean package state)
   - **Conflicts Expected:** `UserContext.tsx`, auth pages, test files
   - **Files:** Auth pages, `UserContext.tsx`, `.env.example`, `README.md`

3. **AuthGuards** - `origin/codex/add-authentication-guards-and-redirects`
   - **Risk Level:** High (middleware, route protection)
   - **Dependencies:** SupabaseAuth
   - **Conflicts Expected:** `middleware.ts`, `UserContext.tsx`, arena components
   - **Files:** `middleware.ts`, auth callbacks, arena components
   - **⚠️ Critical:** Resolve `openai.d.ts` vs `types/openai.d.ts` file conflict

4. **MoreAPIRoutes** - `origin/codex/add-api-routes-for-sessions,-activity-log,-feedback`
   - **Risk Level:** Medium (extends existing APIs)
   - **Dependencies:** AuthGuards, SupabaseAuth
   - **Conflicts Expected:** API route extensions (should be additive)
   - **Files:** `src/app/api/activity-log/`, `src/app/api/anonymous-session/`

#### Tier 2: Core Evaluation & Leaderboard Logic
**Order:** Build upon authentication foundation

5. **EvalSaveLogic** - `origin/codex/modify-model-evaluation-saving-logic`
   - **Risk Level:** Medium (core evaluation flow)
   - **Dependencies:** SupabaseAuth
   - **Conflicts Expected:** `model-leaderboard` API, test files
   - **Files:** `src/app/api/model-leaderboard/route.ts`

6. **SpeedLeaderboard** - `origin/codex/implement-speed-mode-leaderboard-api-and-ui`
   - **Risk Level:** Low (isolated speed feature)
   - **Dependencies:** None (speed foundation already merged)
   - **Conflicts Expected:** Minimal
   - **Files:** Speed leaderboard API and UI

7. **EvalSaveLeaderboard** - `origin/codex/update-evaluation-saving-logic-and-leaderboard`
   - **Risk Level:** Very High (broadest scope, many conflicts)
   - **Dependencies:** All previous merges
   - **Conflicts Expected:** Multiple API routes, test files
   - **Files:** Numerous API routes, leaderboard logic
   - **⚠️ Note:** Save this for last due to extensive conflicts

#### Tier 3: Configuration & Enhancement Features
**Order:** Low-risk improvements

8. **Config Features** (can be merged in parallel):
   - `origin/codex/add-config-file-for-system-instructions`
   - `origin/codex/add-config-for-date-range-visibility-on-leaderboard`
   - `origin/codex/add-dataset_downloads-table-and-tracking`

9. **UI/UX Improvements**:
   - `origin/codex/normalize-styles-across-modes`
   - `origin/codex/refactor-ai-integration-for-modular-architecture`

### Phase 3: Quality Assurance

#### After Each Merge:
1. **Run automated tests:**
   ```bash
   npm test
   npm run build
   ```

2. **Manual smoke testing:**
   - Authentication flow
   - Core evaluation functionality
   - Leaderboard displays
   - Speed mode features

3. **Conflict resolution verification:**
   - Ensure no functionality lost
   - Verify file path consolidation (especially `openai.d.ts`)
   - Test database migrations

#### Pre-Main Merge Checklist:
- [ ] All tests passing
- [ ] Manual testing of critical paths completed
- [ ] No TypeScript errors
- [ ] Build succeeds without warnings
- [ ] Database migrations run successfully
- [ ] Authentication flows work end-to-end

### Phase 4: Final Integration

```bash
# After all features merged and tested on testing-integration-v2
git checkout main
git pull origin main
git merge testing-integration-v2
git push origin main
```

## Conflict Resolution Strategy

### High-Risk Files (Expected Conflicts):
1. **`src/contexts/UserContext.tsx`** - Authentication state management
2. **`src/app/api/*/route.ts`** - API route enhancements
3. **`test/api-routes.test.js`** - Test coverage additions
4. **`package.json`/`package-lock.json`** - Dependency updates
5. **`middleware.ts`** - Route protection logic

### Resolution Approach:
- **Take time** to understand both versions of conflicted code
- **Preserve functionality** from both branches when possible
- **Test immediately** after resolving conflicts
- **Document** any difficult resolution decisions

## Estimated Timeline
- **Phase 1:** 30 minutes (branch setup)
- **Phase 2:** 4-6 hours (depending on conflict complexity)
- **Phase 3:** 2-3 hours (testing and verification)
- **Phase 4:** 30 minutes (final merge)

**Total Estimated Time:** 7-10 hours

## Risk Mitigation
1. **Backup strategy:** Keep `main` stable, work only on testing branch
2. **Incremental approach:** Test after each major merge
3. **Rollback plan:** Can revert to `main` if critical issues arise
4. **Documentation:** Record all conflict resolution decisions

## Success Metrics
- All target features successfully integrated
- No regression in existing functionality
- All tests passing
- Clean, stable codebase ready for production deployment 