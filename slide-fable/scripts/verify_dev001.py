"""Single local/CI command for DEV-001. Output is machine-readable evidence."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]


def material_hashes():
    return {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(ROOT.rglob('*')) if p.is_file()
            and not any(part in ('__pycache__','node_modules','generated','dist','test-results','playwright-report') for part in p.parts)
            and '.system-builder' not in p.parts}


if __name__=='__main__':
    env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
    structure=subprocess.run([sys.executable,str(ROOT/'scripts/verify_planning.py')],env=env,capture_output=True,text=True)
    if structure.returncode:
        print(structure.stdout+structure.stderr,file=sys.stderr)
        raise SystemExit(structure.returncode)
    tests=subprocess.run([sys.executable,'-m','unittest','discover','-s',str(ROOT/'tests'),'-v'],env=env,capture_output=True,text=True)
    if tests.returncode:
        print(tests.stdout+tests.stderr,file=sys.stderr)
        raise SystemExit(tests.returncode)
    paths=material_hashes()
    digest=hashlib.sha256(json.dumps(paths,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    print(json.dumps({'result':'PASS','step':'DEV-001','scope':'data_contract_only',
                      'structure':json.loads(structure.stdout),'unittest_output':tests.stderr,
                      'fixture_cases':len(json.loads((ROOT/'fixtures/manifest.json').read_text())['cases']),
                      'material_sha256':digest,'material_files':paths,
                      'not_run':['browser_import','rendering','HTML_export','PDF_export','PPTX_export','PWA_installation']},ensure_ascii=False,indent=2))
