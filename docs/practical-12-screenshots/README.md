# Practical 12 GitHub Actions screenshots

This Codespaces session cannot capture genuine browser screenshots and has not authenticated with GitHub. No screenshot files are included yet. Capture the actual completed GitHub Actions runs after pushing the workflow and verifying the run results; do not fabricate or substitute terminal output.

On a MacBook:

1. Sign in to GitHub and open [the repository's CI Pipeline runs](https://github.com/SHUBHAM98799/AWT/actions/workflows/ci.yml).
2. Select the `p12` branch in the workflow-run filters. Open each completed run and expand the relevant job/step so the status or test output is readable.
3. Use **Shift-Command-5** to capture the relevant window or screen area, or **Shift-Command-4** to select the visible GitHub result. Keep the run status, commit, branch, and relevant test log visible; do not capture credentials or secrets.
4. Save only real captures here using these names:
   - `01-passing-pipeline-initial.png` — the initial valid run, green.
   - `02-deliberately-failed-pipeline.png` — the intentional assertion-failure run, red.
   - `03-failed-test-log.png` — the failed test step showing the incorrect expected value.
   - `04-fixed-passing-pipeline.png` — the final corrected run, green.
   - `05-successful-test-logs.png` — the final successful test step.
   - `06-workflow-file.png` — `.github/workflows/ci.yml` displayed on GitHub.
   - `07-final-commit.png` — the `p12` branch and final commit displayed on GitHub.

Do not create the failed-run screenshots until the initial valid GitHub Actions run is confirmed green. The current session has not created or verified any of these runs.
