# Track Plan: Revise Image Switching Workflow and Safety

## Phase 1: Preparation & Analysis [checkpoint: 06153c0]
- [x] Task: Analyze current script logic
    - [x] Subtask: Read `scripts/swap-duo-chrome-images.js` to understand current destructive behavior.
    - [x] Subtask: Identify where this script is called in `package.json` or `nx.json`.
- [x] Task: Install dependencies [6240676]
    - [x] Subtask: Add `commander` to `devDependencies` in `package.json`.
    - [x] Subtask: Run install command.

## Phase 2: Refactoring `swap-duo-chrome-images.js`
- [x] Task: Create new script structure [1b41603]
    - [x] Subtask: Write Test: Create a test file `test/scripts/swap-images.test.js` (or similar) to mock filesystem operations.
    - [x] Subtask: Implement basic `commander` setup with `--help` and version.
- [x] Task: Implement Safe Copy Logic [d1af46c]
    - [x] Subtask: Write Test: Verify that "source" directory remains untouched.
    - [x] Subtask: Implement logic to `cp -r` (or node equivalent) from source to `public/images`, replacing the old swap logic.
    - [x] Subtask: Add error handling for missing source directories.
- [x] Task: Add Safety Flags [aa1f757]
    - [x] Subtask: Write Test: Verify `--dry-run` logs actions without performing them.
    - [x] Subtask: Implement `--dry-run` flag.
    - [x] Subtask: Implement `--force` flag for overwriting existing `public/images` content.
- [ ] Task: Implement Timestamp Backup for Existing Target
    - [ ] Subtask: Write Test: Verify target is renamed with timestamp if it exists.
    - [ ] Subtask: Implement backup logic using ISO timestamp.

## Phase 3: Integration & Documentation
- [ ] Task: Update Project Configuration
    - [ ] Subtask: Update `package.json` scripts to use the new flags (e.g., `npm run images:work` might become `node scripts/swap.js --source images_main`).
    - [ ] Subtask: Verify `nx` targets calling this script still work.
- [ ] Task: Update Documentation
    - [ ] Subtask: Update `AGENTS.md` with strict rules about image handling.
    - [ ] Subtask: Update `apps/duo-chrome/README.md` (or relevant doc) with new command usage.
- [ ] Task: Conductor - User Manual Verification 'Integration & Documentation' (Protocol in workflow.md)
