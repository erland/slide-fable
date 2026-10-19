import json
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
p=Path(__file__).parent
s=json.loads((p/'ppd.schema.json').read_text()); d=json.loads((p/'example.ppd.json').read_text())
Draft202012Validator.check_schema(s)
errors=list(Draft202012Validator(s,format_checker=FormatChecker()).iter_errors(d))
for error in errors: print('/'.join(map(str,error.path)), error.message)
assert not errors, f"{len(errors)} validation errors"
print("PASS: schema and example validate")
