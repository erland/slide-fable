import unittest
import json
import os
import subprocess
import tempfile
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from release_gates import load_profile, summarize, validate_profile

class ReleaseGatesTests(unittest.TestCase):
    def test_checked_in_profile(self):
        p=load_profile()
        self.assertGreaterEqual(len(p['gates']), 10)
        self.assertEqual(summarize(p)['release_readiness'], 'NOT_READY')
    def test_automated_pass_does_not_approve_mvp(self):
        p=load_profile()
        checks=[{'name':name,'result':'PASS'} for g in p['gates'] if g['kind']=='AUTOMATED' for name in g['required_checks']]
        result=summarize(p, checks)
        self.assertEqual(result['automated_result'],'PASS')
        self.assertEqual(result['release_readiness'],'NOT_READY')
        self.assertIn('RG-009',result['open_gate_ids'])
    def test_missing_ci_evidence_stays_pending(self):
        self.assertIn('RG-002', summarize(load_profile())['open_gate_ids'])
    def test_lint_alone_never_attests_entire_quality_gate(self):
        result=summarize(load_profile(), [{'name':'lint','result':'PASS'}])
        gate=next(g for g in result['gates'] if g['id']=='RG-001')
        self.assertEqual(gate['result'],'PENDING')
        self.assertIn('Python contract regression',gate['missing_checks'])

    def test_any_required_failure_blocks_gate(self):
        p=load_profile()
        evidence=[{'name':name,'result':'PASS'} for g in p['gates'] if g['kind']=='AUTOMATED' for name in g['required_checks']]
        next(e for e in evidence if e['name']=='common presentation workflows')['result']='FAIL'
        r=summarize(p,evidence)
        self.assertEqual(next(g for g in r['gates'] if g['id']=='RG-002')['result'],'FAIL')
        self.assertEqual(r['automated_result'],'INCOMPLETE')

    def test_duplicate_evidence_is_rejected(self):
        with self.assertRaises(ValueError):
            summarize(load_profile(), [{'name':'lint','result':'PASS'}]*2)

    def test_missing_required_checks_invalid_profile(self):
        p=load_profile();p['gates'][0].pop('required_checks')
        with self.assertRaises(ValueError):validate_profile(p)

    def test_failed_candidate_check_writes_pending_failure_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            fake_npm = Path(temporary) / 'npm'
            fake_npm.write_text('#!/bin/sh\necho simulated-lint-failure >&2\nexit 7\n')
            fake_npm.chmod(0o755)
            result_path = Path(temporary) / 'release-evidence.json'
            env = {**os.environ,
                   'PATH': temporary + os.pathsep + os.environ.get('PATH', ''),
                   'RELEASE_EVIDENCE_OUTPUT': str(result_path)}
            result = subprocess.run([sys.executable, str(Path(__file__).resolve().parents[1] / 'scripts' / 'verify_release_candidate.py')],
                                    env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 7)
            evidence = json.loads(result_path.read_text())
            self.assertEqual(evidence['result'], 'FAILED')
            self.assertEqual(evidence['release_readiness'], 'NOT_READY')
            self.assertEqual(evidence['failure']['check'], 'lint')
            self.assertEqual(evidence['checks'], [{'name': 'lint', 'result': 'FAIL'}])
            self.assertEqual(next(g for g in evidence['release_gates']['gates'] if g['id'] == 'RG-001')['result'], 'FAIL')
            self.assertEqual(next(g for g in evidence['release_gates']['gates'] if g['id'] == 'RG-002')['result'], 'PENDING')

    def test_profile_rejects_pre_attested_manual_pass(self):
        p=load_profile();p['gates'][4]['status']='PASS'
        with self.assertRaises(ValueError):validate_profile(p)
    def test_profile_rejects_pre_attested_automatic_pass(self):
        p=load_profile();p['gates'][0]['status']='PASS'
        with self.assertRaises(ValueError):validate_profile(p)

if __name__=='__main__':unittest.main()
