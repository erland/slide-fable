import unittest
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
        checks=[{'name':g['ci_check'],'result':'PASS'} for g in p['gates'] if 'ci_check' in g]
        result=summarize(p, checks)
        self.assertEqual(result['automated_result'],'PASS')
        self.assertEqual(result['release_readiness'],'NOT_READY')
        self.assertIn('RG-009',result['open_gate_ids'])
    def test_missing_ci_evidence_stays_pending(self):
        self.assertIn('RG-002', summarize(load_profile())['open_gate_ids'])
    def test_profile_rejects_pre_attested_manual_pass(self):
        p=load_profile();p['gates'][4]['status']='PASS'
        with self.assertRaises(ValueError):validate_profile(p)
    def test_profile_rejects_pre_attested_automatic_pass(self):
        p=load_profile();p['gates'][0]['status']='PASS'
        with self.assertRaises(ValueError):validate_profile(p)

if __name__=='__main__':unittest.main()
