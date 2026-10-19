"""Reproduce DEV-002 with preinstalled npm dependencies and browser binaries."""
from pathlib import Path
import json
import os
import subprocess
import sys

root=Path(__file__).resolve().parents[1]
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
def run(args,cwd=root):
    p=subprocess.run(args,cwd=cwd,env=env,capture_output=True,text=True)
    if p.returncode:
        print(p.stdout+p.stderr,file=sys.stderr)
        raise SystemExit(p.returncode)
    return p.stdout
baseline=json.loads(run([sys.executable,'scripts/verify_dev001.py']))
spike=root/'spikes/dev002'
run(['npm','run','build'],spike)
run(['npm','run','verify'],spike)
evidence=Path(env.get('SPIKE_OUTPUT',str(spike/'generated/evidence')))
files=json.loads(run([sys.executable,'scripts/verify_dev002_files.py',str(evidence)]))
browser=json.loads((evidence/'browser-results.json').read_text())
print(json.dumps({'result':'passed_with_deferred','step':'DEV-002','contract_tests':'PASS',
                  'browser_engine':browser['engine'],'browser_checks':len(browser['checks']),
                  'files_checks':files['check_count'],'webkit':browser['webkit'],
                  'material_sha256':baseline['material_sha256'],
                  'deferred':['Actual Safari/iPad file handling and touch','Actual PowerPoint Mac/Windows opening/editing'],
                  'known_limitations':['Effect fallback is approximate; general backdrop fidelity not implemented','Rich text bridge currently proves paragraph/run subset, not lists, IME or all marks']},ensure_ascii=False,indent=2))
