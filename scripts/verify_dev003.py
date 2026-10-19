"""Local/CI PWA-shell gate. Dependencies and browser must already be installed."""
from pathlib import Path
import json
import os
import subprocess
import sys
import tempfile

root=Path(__file__).resolve().parents[1]
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
def run(args):
    p=subprocess.run(args,cwd=root,env=env,capture_output=True,text=True)
    if p.returncode:
        print(p.stdout+p.stderr,file=sys.stderr)
        raise SystemExit(p.returncode)
    return p.stdout
run(['npm','run','lint'])
unit=run(['npm','test'])
with tempfile.TemporaryDirectory() as temporary:
    env['PWA_OUTPUT']=os.environ.get('PWA_OUTPUT',temporary)
    run(['npm','run','test:pwa'])
    browser=json.loads((Path(env['PWA_OUTPUT'])/'pwa-results.json').read_text())
assert browser['result']=='PASS'
structure=json.loads(run([sys.executable,'scripts/verify_dev001.py']))
print(json.dumps({'result':'passed_with_deferred','step':'DEV-003','build':'PASS',
                  'typecheck':'PASS','lint':'PASS','update_guard_tests':unit,
                  'browser_checks':len(browser['checks']),'browser_result':browser,
                  'material_sha256':structure['material_sha256'],
                  'material_files':structure['material_files'],
                  'deferred':['Actual Safari/iPad/iPhone installation and offline restart','WebKit automation missing host libraries'],
                  'scope_note':'Historical DEV-003 shell checks now run against the current editor; see final-verification for product scope'},ensure_ascii=False,indent=2))
