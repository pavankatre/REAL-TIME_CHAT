# Branching Strategy & Workflow

This document outlines the professional branching strategy for the **REAL-TIME CHAT** project.

## Branches

### 1. `main` (Production)
- **Role**: Stable code that is currently in production.
- **Rules**: Never commit directly to `main`. Only merge from `uat` after successful verification.

### 2. `uat` (User Acceptance Testing)
- **Role**: Staging environment for testing and validation.
- **Rules**: Merge from `dev` when a feature set is complete. Verify all tests pass here before merging to `main`.

### 3. `dev` (Development)
- **Role**: Integration branch for ongoing development.
- **Rules**: Daily work and feature branches merge into `dev`.

---

## Workflow Flow (Dev → UAT → Prod)

1. **Development**:
   - Create a feature branch from `dev`: `git checkout -b feature/chat-fix dev`
   - Work and commit changes.
   - Merge back to `dev`: `git checkout dev ; git merge feature/chat-fix`

2. **Testing**:
   - When ready for testing, merge `dev` into `uat`: `git checkout uat ; git merge dev ; git push origin uat`

3. **Production Release**:
   - After UAT approval, merge `uat` into `main`: `git checkout main ; git merge uat ; git push origin main`

---

## Best Practices
- **Commit Messages**: Use clear, descriptive messages (e.g., `feat: add group chat functionality`).
- **Sync Regularly**: Always `git pull origin dev` before starting new work.
- **Code Reviews**: If working in a team, use Pull Requests to merge code into `dev`, `uat`, and `main`.
