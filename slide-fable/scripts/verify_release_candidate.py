"""Automated candidate checks. Green automation is not product release approval."""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--require-ready',action='store_true');args=parser.parse_args()
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
checks=[]
def run(name,command):
    p=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True)
    if p.returncode:
        print(p.stdout+p.stderr,file=sys.stderr);raise SystemExit(p.returncode)
    checks.append({'name':name,'result':'PASS'});return p.stdout
run('lint',['npm','run','lint']);unit=run('TypeScript contract/editor/update-safety',['npm','test'])
run('Python contract regression',[sys.executable,'-m','unittest','discover','-s','tests','-v'])
with tempfile.TemporaryDirectory(prefix='slide-fable-final-') as temporary:
    env['EDITOR_OUTPUT']=os.environ.get('EDITOR_OUTPUT',str(Path(temporary)/'editor'))
    env['PWA_OUTPUT']=os.environ.get('PWA_OUTPUT',str(Path(temporary)/'pwa'))
    run('editor browser flows',['npm','run','test:editor'])
    editor=json.loads((Path(env['EDITOR_OUTPUT'])/'editor-results.json').read_text())
    run('production build / typecheck / offline / updates',['npm','run','test:pwa'])
    pwa=json.loads((Path(env['PWA_OUTPUT'])/'pwa-results.json').read_text());assert pwa['result']=='PASS'
    from pypdf import PdfReader
    pdf=PdfReader(str(Path(env['EDITOR_OUTPUT'])/'presentation.pdf'))
    assert len(pdf.pages)==3 and 'ÅÄÖ' in '\n'.join(p.extract_text() for p in pdf.pages)
    checks.append({'name':'PDF three pages and searchable Swedish text','result':'PASS'})
run('source, references, machine status and project hygiene',[sys.executable,'scripts/verify_planning.py'])
# The build is done by test:pwa and restored to the package version before exit.
files={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ROOT.rglob('*')) if p.is_file() and not any(x in ('node_modules','dist','generated','__pycache__','test-results','playwright-report','.system-builder') for x in p.parts)}
result={'result':'AUTOMATED_PASS_RELEASE_NOT_READY','version':json.loads((ROOT/'package.json').read_text())['version'],'release_readiness':'NOT_READY','checks':checks,'unit_output':unit,'contract_fixture_cases':58,'editor':editor,'pwa':pwa,'source_sha256':hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'material_files':files,'open_gates':'docs/release-review.md','not_run':['physical Safari/iPad/iPhone installation and editing','WebKit (missing host libraries)','PowerPoint Mac/Windows open and edit','full visual reference suite','remote GitHub Actions']}
print(json.dumps(result,ensure_ascii=False,indent=2))
if args.require_ready:raise SystemExit(2)
