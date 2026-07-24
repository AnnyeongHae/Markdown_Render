# Git Workflow & Human Approval Rules

1. **Never Push Directly to `main` Branch**:
   - Always create a new feature/fix branch (e.g., `feat/feature-name` or `fix/bug-name`) before starting any development or modifications.

2. **Test Thoroughly Before Proposing Merge**:
   - Run automated verification scripts (`node test_...js`) and verify all features empirically in local browser.

3. **Require Human Approval**:
   - Present the test results and walkthrough to the **User (Human)**.
   - Do **NOT** execute `git merge main` or `git push origin main` until the **User (Human)** explicitly gives approval.

4. **Merge and Push Protocol**:
   - Upon receiving explicit Human Approval:
     1. `git checkout main`
     2. `git merge feat/feature-name`
     3. `git push origin main`
