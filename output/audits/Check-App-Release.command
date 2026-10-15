#!/bin/zsh
set -u
task_audit_dir="${0:A:h}"
python3 "$task_audit_dir/../campaign/tools/release-check.py"
task_exit=$?
if [[ -f "$task_audit_dir/release-check/latest.html" ]]; then
  open "$task_audit_dir/release-check/latest.html"
fi
exit "$task_exit"
