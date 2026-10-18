#!/usr/bin/env python3
"""Repository-specific redistribution policy, not legal advice."""
from pathlib import Path
import json
import re
root = Path(__file__).resolve().parents[1]
records = json.loads((root / 'docs/dependencies.json').read_text())
errors = []
for package in records:
    expression = package['license']
    # All OR choices offering MIT are consumed under MIT; AND clauses remain.
    allowed = ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'Unlicense', 'BSL-1.0', 'Unicode-3.0', 'CC0-1.0', 'BlueOak-1.0.0']
    if expression == 'MPL-2.0' and package['development_only']:
        pass  # Unmodified build tools, excluded from shipped application code.
    elif not any(choice in expression for choice in allowed):
        errors.append(f'Unreviewed license: {package["name"]} {expression}')
    elif re.search(r'\b(?:AGPL|GPL|LGPL|EPL)',expression) and not (' OR ' in expression and 'MIT' in expression):
        errors.append(f'Unreviewed reciprocal license: {package["name"]} {expression}')
    if not package['notices'] or any(not (root / p).is_file() for p in package['notices']):
        errors.append(f'Missing license text: {package["name"]}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'License policy passed: {len(records)} dependency records with notices.')
