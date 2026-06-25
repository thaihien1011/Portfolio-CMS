# Project Coding, Testing & Quality Rules

This document outlines the development guidelines, testing checklists, and project workflows for **Portfolio CMS** to ensure maximum code stability, security, and requirement coverage.

---

## 1. Development Workflows & Planning
*   **Write Implementation Plans**: Always write an implementation plan to ask for review and approval before you start coding any new features or major modifications.
*   **Analyze Requirements First**: Always read user stories and scan related specification documents to ensure coverage of 99% of the requirements. If you find any missing or ambiguous requirements, ask the user for clarification before declaring a task done.
*   **Package Management Guidelines**: Always use new and regularly updated packages. Do NOT use any packages that have known vulnerabilities (`npm audit` must pass cleanly) or have not been updated for more than 6 months.

---

## 2. Testing & Quality Assurance Checklists
*   **Unit & Feature Testing**: Always write and execute unit tests for each feature you develop.
*   **Local Test Run**: Always run `npm test` (or validation scripts) before pushing code to Git.
*   **Regression Testing**: Always perform a regression test on all related features after making any changes to the code to ensure nothing else was broken.
*   **Security Testing**: Perform a basic security verification (such as validating authenticated routes, checking headers, and scanning inputs) every time code changes are made.
*   **Reset Test Artifacts**: After finishing testing, reset any temporary test files or configurations back to their original state before pushing code to Git.

---

## 3. Bug Prevention & Defensive Coding (Lessons Learned)
*   **Shared Reference Checks**: To prevent `ReferenceError` crashes when copying components or UI logic between workspaces (e.g., `Web public` and `Web admin`), verify that all helper functions, imports, constants, or styles are fully defined or imported in all relevant scopes.
*   **Null Data Protection**: Enforce defensive logical OR fallbacks (`|| ''`, `|| 0`, `|| []`) and optional chaining (`?.`) on all frontend states when reading database rows. Optional column inputs (like optional image URLs, tags, or description fields) must never cause rendering crashes.
*   **Session Management Security**: Maintain realistic JWT expiration lifespans (e.g. `8h`) and intercept expired token errors (`401`/`403`) to redirect the user to the log-in page instead of crashing the view.
*   **Consistent Build Targets**: Frontends must configure `build.target: 'esnext'` inside `vite.config.js` to ensure modern JS feature compilation parity.

---

## 4. Git Workflows, Commits & Rollbacks
*   **Clean Tree Comparisons**: After pushing code to Git, compare the code in the current working tree with Git to ensure there are no gaps, missing files, or untracked modifications.
*   **Commit Message Standards**: Always write descriptive and high-quality commit messages explaining the rationale behind changes. Only commit when all tests pass and you feel confident in the code.
*   **Approval Gate**: Always get explicit user approval before pushing code to Git.
*   **Work Summaries**: A detailed work summary is required to ask for review and approval to push code.
*   **Stuck Protocol**: Summarize your work and report back to the user immediately if you get stuck on a problem for more than 30 minutes.
*   **Rollback Protocol**: Roll back to the previous working commit when facing critical, unresolved issues.
    *   To get approval for a rollback, write a detailed summary explaining why you want to roll back, what has been done, the impacts, and the proposed solutions.

---

## 5. User Experience & UI Feedback Rules
*   **Toast Notifications for Actions**: Always show toast messages (success or failure) to give the administrator feedback when executing state-modifying actions (such as saving profile updates, submitting forms, deleting items, translation requests, or authentication attempts).
*   **Visual Indicators**: Ensure all asynchronous processing actions display a loading indicator or disable buttons to prevent double submissions.