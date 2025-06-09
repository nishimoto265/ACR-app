---
name: CI Failure Report
title: 'CI Failure: Workflow run ${{ github.run_id }} on ${{ github.ref }}'
labels: bug, ci-failure
---

## CI Failure Details

- **Workflow Name**: ${{ github.workflow }}
- **Job Name**: ${{ github.job }}
- **Run ID**: ${{ github.run_id }}
- **Run Number**: ${{ github.run_number }}
- **Triggering Event**: ${{ github.event_name }}
- **Branch/Ref**: ${{ github.ref }}
- **Commit SHA**: ${{ github.sha }}
- **Actor**: ${{ github.actor }}

**Link to failed run**: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}

Please investigate and address the failure. 