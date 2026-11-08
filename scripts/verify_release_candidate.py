"""Automated candidate checks. Green automation is not product release approval."""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--require-ready',action='store_true');args=parser.parse_args()
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
checks=[]
def publish_evidence(failure=None):
    """Always retain a truthful gate snapshot, including when a check fails."""
    target_name=os.environ.get('RELEASE_EVIDENCE_OUTPUT')
    if not target_name:
        return
    from release_gates import load_profile, summarize
    target=Path(target_name)
    target.parent.mkdir(parents=True,exist_ok=True)
    gates=summarize(load_profile(), checks)
    record={
        'version': json.loads((ROOT/'package.json').read_text())['version'],
        'result': ('FAILED' if failure else 'AUTOMATED_PASS_RELEASE_NOT_READY'
                   if gates['automated_result']=='PASS' else 'INCOMPLETE'),
        'release_readiness': 'NOT_READY',
        'checks': checks,
        'release_gates': gates,
    }
    if failure:
        record['failure']=failure
    temporary=target.with_name(target.name+'.tmp')
    temporary.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temporary.replace(target)

def run(name,command):
    try:
        p=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True)
    except OSError as exc:
        checks.append({'name':name,'result':'FAIL'})
        publish_evidence({'check':name,'command':command,'error':str(exc)})
        raise SystemExit(f'Cannot execute {name}: {exc}') from exc
    if p.returncode:
        checks.append({'name':name,'result':'FAIL'})
        publish_evidence({'check':name,'command':command,'exit_code':p.returncode,
                          'output_tail':(p.stdout+p.stderr)[-6000:]})
        print(p.stdout+p.stderr,file=sys.stderr)
        raise SystemExit(p.returncode)
    checks.append({'name':name,'result':'PASS'})
    publish_evidence()
    return p.stdout
run('lint',['npm','run','lint']);unit=run('TypeScript contract/editor/update-safety',['npm','test'])
run('Python contract regression',[sys.executable,'-m','unittest','discover','-s','tests','-v'])
with tempfile.TemporaryDirectory(prefix='slide-fable-final-') as temporary:
    env['EDITOR_OUTPUT']=os.environ.get('EDITOR_OUTPUT',str(Path(temporary)/'editor'))
    env['PWA_OUTPUT']=os.environ.get('PWA_OUTPUT',str(Path(temporary)/'pwa'))
    run('document lifecycle browser regression',['npm','run','test:lifecycle'])
    run('text overflow browser flows',['npm','run','test:text-overflow'])
    run('editor / native PDF-PPTX text fidelity',['npm','run','test:text-export'])
    run('common presentation workflows',['npm','run','test:common-workflows'])
    run('editor browser flows',['npm','run','test:editor'])
    editor=json.loads((Path(env['EDITOR_OUTPUT'])/'editor-results.json').read_text())
    run('production build / typecheck / offline / updates',['npm','run','test:pwa'])
    pwa=json.loads((Path(env['PWA_OUTPUT'])/'pwa-results.json').read_text());assert pwa['result']=='PASS'
    from pypdf import PdfReader
    pdf=PdfReader(str(Path(env['EDITOR_OUTPUT'])/'presentation.pdf'))
    assert len(pdf.pages)==3 and 'ÅÄÖ' in '\n'.join(p.extract_text() for p in pdf.pages)
    checks.append({'name':'PDF three pages and searchable Swedish text','result':'PASS'})
    publish_evidence()
run('source, references, machine status and project hygiene',[sys.executable,'scripts/verify_planning.py'])
# Derive explicit per-platform/per-format gates from actual named CI checks.
from release_gates import load_profile, summarize
release_gate_results=summarize(load_profile(),checks)
# Only this completed invocation can produce an evidence artifact. Never pre-attest
# gates in the checked-in profile, and keep manual acceptance open.
publish_evidence()
# The build is done by test:pwa and restored to the package version before exit.
files={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ROOT.rglob('*')) if p.is_file() and not any(x in ('node_modules','dist','generated','__pycache__','test-results','playwright-report','.system-builder') for x in p.parts)}
result={'result':'AUTOMATED_PASS_RELEASE_NOT_READY','version':json.loads((ROOT/'package.json').read_text())['version'],'release_readiness':'NOT_READY','release_gates':release_gate_results,'checks':checks,'unit_output':unit,'contract_fixture_cases':58,'editor':editor,'pwa':pwa,'source_sha256':hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'material_files':files,'open_gates':'docs/release-review.md','not_run':['physical Safari/iPad/iPhone installation and editing','WebKit (missing host libraries)','PowerPoint Mac/Windows open and edit','full visual reference suite','remote GitHub Actions']}
print(json.dumps(result,ensure_ascii=False,indent=2))
if args.require_ready:raise SystemExit(2)
