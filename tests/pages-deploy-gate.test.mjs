import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const pages=readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8');
const verify=readFileSync(new URL('../.github/workflows/verify.yml',import.meta.url),'utf8');

test('Pages runs only after successful verification on main',()=>{
 assert.match(pages,/workflow_run:\s*\n\s*workflows: \["Verify Slide Fable candidate"\]/);
 assert.match(pages,/types: \[completed\]/);
 assert.match(pages,/branches: \[main\]/);
 assert.match(pages,/workflow_run\.conclusion == 'success'/);
 assert.match(pages,/workflow_run\.head_repository\.full_name == github\.repository/);
 assert.match(pages,/workflow_run\.head_branch == 'main'/);
 assert.match(pages,/workflow_run\.head_sha/);
 assert.doesNotMatch(pages,/^  push:/m);
 assert.doesNotMatch(pages,/^  workflow_dispatch:/m);
});

test('Pages builds the verified revision without duplicate browser testing',()=>{
 assert.match(pages,/ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
 assert.match(pages,/git rev-parse HEAD/);
 assert.match(pages,/git ls-remote origin refs\/heads\/main/);
 assert.match(pages,/actions\/runs\/\$VERIFIED_RUN_ID/);
 assert.match(pages,/SF_BUILD_ID: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
 assert.match(pages,/run: npm run build/);
 assert.doesNotMatch(pages,/run: npm test/);
 assert.doesNotMatch(pages,/playwright install|pdftoppm|poppler-utils/);
});

test('Manual deployments must start from the verified main workflow',()=>{
 assert.match(verify,/^  workflow_dispatch:/m);
 assert.match(verify,/^  push:\s*\n\s*branches: \[main\]/m);
 assert.match(pages,/workflow_run\.event == 'workflow_dispatch'/);
});
