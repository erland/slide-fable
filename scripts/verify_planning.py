from pathlib import Path
import hashlib, json, re, subprocess, sys, tempfile, os, shutil
import yaml
from jsonschema import Draft202012Validator, FormatChecker

root=Path(__file__).resolve().parents[1]
os.environ['PYTHONDONTWRITEBYTECODE']='1'
checks=[]
def check(name,ok):
 if not ok: raise AssertionError(name)
 checks.append({'check':name,'result':'PASS'})
s=json.loads((root/'reference/ppd.schema.json').read_text())
Draft202012Validator.check_schema(s)
check('reference_schema_valid',True)
sample=json.loads((root/'reference/example.ppd.json').read_text())
Draft202012Validator(s,format_checker=FormatChecker()).validate(sample)
check('reference_example_valid',True)
hashes=json.loads((root/'.system-builder/reference-hashes.json').read_text())
for p,h in hashes.items(): check('reference_sha256:'+p,hashlib.sha256((root/p).read_bytes()).hexdigest()==h)
status=yaml.safe_load((root/'.system-builder/work-status.yaml').read_text())
state_schema=json.loads((root/'.system-builder/work-status.schema.json').read_text())
Draft202012Validator.check_schema(state_schema)
Draft202012Validator(state_schema).validate(status)
check('work_status_schema',True)
check('phase_consistency',status['phase'] in ('planning_handoff','development','release_review') and status['implementation'] in ('not_started','in_progress'))
active=status['selected_step']
check('selection_consistency',active==status['in_progress'])
if active:
 check('active_step_exists',any(x['id']==active and x['status']=='in_progress' for x in status['steps']))
expected_next=next((x['id'] for x in status['steps'] if x['status']!='completed'),None)
check('next_matches_remaining_work',status['next']['recommended']==expected_next)
ids=[]
for step in status['steps']:
 check('valid_step:'+step['id'],step['id'] not in ids and all(x in ids for x in step['dependencies']) and step['status'] in ('planned','completed','in_progress','blocked'))
 if step['status'] in ('completed','in_progress'):
  check('completed_dependencies:'+step['id'],all(next(x for x in status['steps'] if x['id']==d)['status']=='completed' for d in step['dependencies']))
 check('step_documented:'+step['id'],('## '+step['id']+' ') in (root/'docs/development-plan.md').read_text())
 ids.append(step['id'])
check('15_steps',len(ids)==15)
trace=yaml.safe_load((root/'.system-builder/traceability.yaml').read_text())
for row in trace['source_requirements']:
 lines=(root/row['source']).read_text().splitlines()
 check('source_trace:'+row['id']+':'+str(row['line']),lines[row['line']-1]==row['source_text'] and row['status'] in ('not_implemented','not_verified','partial','verified'))
check('pwa_requirement_trace',len(trace['added_requirements'])==12 and all(x['id'] in (root/x['source']).read_text() for x in trace['added_requirements']))
for group in trace['coverage_groups']:check('coverage_steps:'+group['source_group'],all(x in ids for x in group['steps']))
for p in [root/'README.md',*sorted((root/'docs').glob('*.md'))]:
 for ref in re.findall(r'`([^`]+\.(?:md|yaml|json|txt|py))`',p.read_text()):
  if ref in ('.system-builder/planning-checks.json','.system-builder/dev001-verification.json'): continue
  if ' ' not in ref and ('/' in ref or ref=='requirements-planning.txt'): check('document_reference:'+ref,(root/ref).is_file())
with tempfile.TemporaryDirectory() as clean:
 shutil.copytree(root,Path(clean)/'source',ignore=shutil.ignore_patterns('node_modules','generated','__pycache__','dist','test-results','playwright-report'))
 hygiene=subprocess.run([sys.executable,str(root/'scripts/vendor/project_hygiene.py'),'--project-root',str(Path(clean)/'source'),'--mode','checkpoint','--json'],capture_output=True,text=True,check=True)
h=json.loads(hygiene.stdout)
# Historical version names are intentional immutable supplied references.
check('checkpoint_hygiene',h['result'] in ('pass','warning') and all(x['code']=='HY200' and x['path'].startswith('reference/') for x in h['findings']))
with tempfile.TemporaryDirectory() as temp:
 adapter=dict(status); adapter['next_step']={'recommended':status['next']['recommended'],'title':status['next']['title']}
 (Path(temp)/'project-status.yaml').write_text(yaml.safe_dump(adapter,allow_unicode=True))
 rec=subprocess.run([sys.executable,str(root/'scripts/vendor/recommend_next_step.py'),'--project-root',temp,'--json'],capture_output=True,text=True,check=True)
 check('canonical_next_step_script',json.loads(rec.stdout)['recommended']['step_id']==('C-AUTO' if status['blocking_issues'] else expected_next))
print(json.dumps({'result':'PASS','scope':'project_structure_and_references','checks':len(checks),'hygiene':h,'next_step':expected_next},ensure_ascii=False,indent=2))
