from pathlib import Path
import copy
import json
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import ppd_contract as c
from jsonschema import Draft202012Validator


class ContractTests(unittest.TestCase):
    def test_schema_is_valid(self):
        Draft202012Validator.check_schema(json.loads((ROOT/'schemas/ppd.schema.json').read_text()))

    def test_fixture_corpus(self):
        manifest=json.loads((ROOT/'fixtures/manifest.json').read_text())
        self.assertEqual(len(manifest['cases']),len({x['file'] for x in manifest['cases']}))
        for case in manifest['cases']:
            with self.subTest(file=case['file']):
                raw=(ROOT/'fixtures'/case['file']).read_text()
                model=c.load_json(raw)
                original=copy.deepcopy(model)
                if 'mode' in case:
                    self.assertEqual(c.negotiate(model)['mode'],case['mode'])
                elif case['error']:
                    with self.assertRaises(c.ContractError) as error:
                        c.validate(model,case['profile'])
                    self.assertEqual(error.exception.code,case['error'])
                else:
                    self.assertEqual(c.validate(model,case['profile'])['result'],'PASS')
                self.assertEqual(model,original,'Validator must not mutate source')

    def original(self):
        return json.loads((ROOT/'reference/example.ppd.json').read_text())

    def test_original_example_migrates_without_semantic_change(self):
        old=self.original();snapshot=copy.deepcopy(old)
        result,report=c.migrate_030(old)
        self.assertEqual(old,snapshot)
        self.assertEqual(result['schemaVersion'],'0.3.1')
        self.assertEqual(result['slides'],old['slides'])
        self.assertTrue(report['original_unchanged'])
        self.assertEqual(c.validate(result)['result'],'PASS')

    def test_alias_and_opaque_extensions_preserved(self):
        old=self.original()
        old['slides'][0]['view']['elements'][0]['box']={'x':1,'y':2,'width':30,'height':40}
        old['extensions']={'vendor':{'box':'not an alias','unknown':[1,2,3]}}
        old['build']={'sourceModelHash':'0'*64}
        result,_=c.migrate_030(old)
        self.assertEqual(result['extensions'],old['extensions'])
        self.assertEqual(result['slides'][0]['view']['elements'][0]['geometry'],old['slides'][0]['view']['elements'][0]['box'])
        self.assertNotIn('box',result['slides'][0]['view']['elements'][0])
        self.assertNotIn('build',result)

    def test_geometry_conflict_rejected(self):
        old=self.original();e=old['slides'][0]['view']['elements'][0]
        e['box']={'x':0,'y':0,'width':10,'height':10}
        e['geometry']={**e['box'],'x':5}
        with self.assertRaises(c.ContractError) as error:c.migrate_030(old)
        self.assertEqual(error.exception.code,'GEOMETRY_CONFLICT')

    def test_identical_aliases_collapse(self):
        old=self.original();e=old['slides'][0]['view']['elements'][0]
        e['box']={'x':0,'y':0,'width':10,'height':10};e['geometry']=dict(e['box'])
        result,_=c.migrate_030(old)
        self.assertEqual(result['slides'][0]['view']['elements'][0]['geometry'],e['box'])

    def test_no_unverified_legacy_migration(self):
        for version in ('0.1.0','0.2.0','5.0.0'):
            old=self.original();old['schemaVersion']=version
            self.assertEqual(c.negotiate(old)['mode'],'read_only')
            with self.assertRaises(c.ContractError):c.migrate_030(old)

    def test_json_roundtrip_preserves_model_hash(self):
        model=json.loads((ROOT/'fixtures/valid-published-model.json').read_text())
        self.assertEqual(c.source_hash(model),c.source_hash(json.loads(json.dumps(model,ensure_ascii=True))))
        reordered=dict(reversed(list(model.items())))
        self.assertEqual(c.source_hash(model),c.source_hash(reordered))
        reordered['build']={'sourceModelHash':'f'*64,'rendererVersion':'another'}
        self.assertEqual(c.source_hash(model),c.source_hash(reordered))
        reordered['document']=dict(model['document'],title='changed')
        self.assertNotEqual(c.source_hash(model),c.source_hash(reordered))

    def test_jcs_numeric_serialization(self):
        self.assertEqual(c.rfc8785.dumps({'n':1.0,'z':-0.0}),b'{"n":1,"z":0}')
        self.assertEqual(c.rfc8785.dumps({'n':1e30}),b'{"n":1e+30}')
        with self.assertRaises(c.rfc8785.CanonicalizationError):c.rfc8785.dumps({'n':2**60})

    def test_strict_json_rejects_duplicate_keys_and_nonfinite(self):
        for raw,code in [('{"a":1,"a":2}','JSON_DUPLICATE_KEY'),('{"a":NaN}','JSON_NUMBER'),('{"a":Infinity}','JSON_NUMBER')]:
            with self.assertRaises(c.ContractError) as error:c.load_json(raw)
            self.assertEqual(error.exception.code,code)


if __name__=='__main__':unittest.main()
