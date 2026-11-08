"""Release evidence profile. CI success never implies overall product acceptance."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / 'docs' / 'release-gates.json'
VALID = {'AUTOMATED', 'MANUAL', 'BLOCKED'}
STATUSES = {'PASS', 'FAIL', 'PENDING', 'BLOCKED'}

def validate_profile(profile: dict) -> dict:
    if profile.get('schema_version') != 1:
        raise ValueError('Unsupported release gate profile version')
    gates = profile.get('gates')
    if not isinstance(gates, list) or not gates:
        raise ValueError('Expected nonempty gates')
    seen = set()
    for gate in gates:
        gid = gate.get('id')
        if not isinstance(gid, str) or not gid or gid in seen:
            raise ValueError(f'Invalid/duplicate gate id: {gid}')
        seen.add(gid)
        kind, status = gate.get('kind'), gate.get('status')
        if kind not in VALID or status not in STATUSES:
            raise ValueError(f'Invalid gate kind/status for {gid}')
        if not all(isinstance(gate.get(x), str) and gate[x].strip() for x in ('area', 'evidence', 'scope')):
            raise ValueError(f'Incomplete evidence/scope for {gid}')
        if kind == 'AUTOMATED':
            required = gate.get('required_checks')
            if not isinstance(required, list) or not required or any(not isinstance(n, str) or not n.strip() for n in required) or len(set(required)) != len(required):
                raise ValueError(f'Automated gate {gid} needs unique required_checks')
        if kind == 'BLOCKED' and status != 'BLOCKED':
            raise ValueError(f'Blocked gate {gid} must be BLOCKED')
        if kind != 'AUTOMATED' and status == 'PASS':
            raise ValueError(f'Unattested non-automated gate {gid} cannot be PASS')
        if kind == 'AUTOMATED' and status == 'PASS':
            raise ValueError(f'Profile cannot pre-attest automated gate {gid}; CI must supply evidence')
    return profile

def summarize(profile: dict, automated_checks: list[dict] | None = None) -> dict:
    """Derive current evidence state. Only exact named CI checks can become PASS."""
    validate_profile(profile)
    checks: dict[str, str] = {}
    for check in automated_checks or []:
        name, result = check.get('name'), check.get('result')
        if not isinstance(name, str) or name in checks or result not in {'PASS', 'FAIL'}:
            raise ValueError('Check evidence must have unique names and PASS/FAIL result')
        checks[name] = result
    rows = []
    for gate in profile['gates']:
        status = gate['status']
        missing = []
        if gate['kind'] == 'AUTOMATED':
            required = gate['required_checks']
            missing = [name for name in required if name not in checks]
            status = ('FAIL' if any(checks.get(name) == 'FAIL' for name in required)
                      else 'PENDING' if missing else 'PASS')
        rows.append({**gate, 'result': status, **({'missing_checks': missing} if gate['kind'] == 'AUTOMATED' else {})})
    return {
        'profile_schema_version': 1,
        'release_readiness': 'NOT_READY',
        'automated_result': 'PASS' if all(x['result'] == 'PASS' for x in rows if x['kind'] == 'AUTOMATED') else 'INCOMPLETE',
        'gates': rows,
        'open_gate_ids': [x['id'] for x in rows if x['result'] != 'PASS'],
    }

def load_profile() -> dict:
    return validate_profile(json.loads(PROFILE.read_text(encoding='utf-8')))

if __name__ == '__main__':
    print(json.dumps(summarize(load_profile()), ensure_ascii=False, indent=2))
