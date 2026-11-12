import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5189', '--strictPort'], { stdio: ['ignore','pipe','pipe'] });
const stderr=[];
server.stderr.on('data', d=>stderr.push(String(d)));
await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Vite startup timeout: '+stderr.join(''))),15000);
  server.stdout.on('data',d=>{if(String(d).includes('5189')){clearTimeout(timer);resolve();}});
  server.on('exit',code=>{clearTimeout(timer);reject(new Error('Vite exited '+code+': '+stderr.join('')));});
});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
const checks=[];
try {
  for(const viewport of [{name:'desktop',width:1440,height:900},{name:'ipad-portrait',width:820,height:1180},{name:'mobile',width:390,height:844}]) {
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
    const page=await context.newPage();const errors=[];page.on('pageerror',err=>errors.push(err.message));
    await page.goto('http://127.0.0.1:5189/');
    const node=page.locator('.editor-canvas-pane .stage .render-element.type-text').first();
    await node.dblclick();
    const group=page.getByRole('group',{name:'Redigera text på bilden'});
    await group.waitFor({state:'visible'});
    const editable=group.getByRole('textbox',{name:'Redigera objektets text'});
    await editable.waitFor({state:'visible'});
    assert.equal(await editable.evaluate(el=>document.activeElement===el),true,viewport.name+': focus should enter text editing');
    const toolbar=group.getByRole('toolbar',{name:'Snabbformatera markerad text'});
    assert.equal(await toolbar.isVisible(),true,viewport.name+': compact formatting should be visible');
    for(const label of ['Fetstil','Kursiv','Understruken','Textstorlek i direktredigering','Textfärg i direktredigering'])
      assert.equal(await toolbar.getByLabel(label,{exact:true}).count(),1,viewport.name+': missing '+label);
    const old=await page.evaluate(async()=>JSON.stringify((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
    await editable.fill('Prova direktredigering');
    await editable.press('ControlOrMeta+A');
    await toolbar.getByRole('button',{name:'Fetstil'}).click();
    assert.equal(await editable.evaluate(el=>document.activeElement===el),true,viewport.name+': toolbar must return focus');
    assert.ok(await editable.locator('strong').count()>0,viewport.name+': bold should apply to selection');
    await group.getByRole('button',{name:'Klar'}).click();
    assert.equal(await group.count(),0,viewport.name+': Done should dismiss edit mode');
    const changed=await page.evaluate(async()=>JSON.stringify((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
    assert.notEqual(changed,old,viewport.name+': editing should persist');
    await page.locator('.editor-header').getByRole('button',{name:'Ångra',exact:true}).click();
    const undone=await page.evaluate(async()=>JSON.stringify((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
    assert.notEqual(undone,changed,viewport.name+': Undo should revert a text-editing transaction');
    await page.locator('.editor-header').getByRole('button',{name:'Gör om',exact:true}).click();
    const redone=await page.evaluate(async()=>JSON.stringify((await import('/src/core/editor.ts')).editorStore.getSnapshot().doc));
    assert.equal(redone,changed,viewport.name+': Redo should restore the formatting transaction');
    // UX-01 regression: the inline controls must reflect the selected run, not stale defaults.
    if (viewport.name === 'desktop') {
      const styledElement=page.locator('.editor-canvas-pane .stage .render-element.type-text').first();
      await styledElement.dblclick();
      const styling=page.getByRole('group',{name:'Redigera text på bilden'});
      const target=styling.getByRole('textbox',{name:'Redigera objektets text'});
      const tool=styling.getByRole('toolbar',{name:'Snabbformatera markerad text'});
      await target.fill('Alfa Beta');
      await target.press('ControlOrMeta+A');
      const size=tool.getByRole('spinbutton',{name:'Textstorlek i direktredigering'});
      const color=tool.getByLabel('Textfärg i direktredigering');
      await size.fill('32');
      await color.fill('#cc0000');
      await target.press('End');
      await target.press('ControlOrMeta+Shift+ArrowLeft');
      await size.fill('44');
      await color.fill('#0000cc');
      // Set the DOM caret inside each run, away from the style boundary. A
      // pixel click can land on a resize handle or adjacent run in some
      // Chromium renderings, causing an unrelated CI-only false failure.
      // Assert the caret's actual text before checking the toolbar state.
      const selectRun=async (index,expectedText)=>{
        const selected=await target.evaluate((element,{index,expectedText})=>{
          const run=element.querySelectorAll('strong')[index];
          const text=run?.firstChild;
          if(!text||text.nodeType!==Node.TEXT_NODE||!text.textContent?.includes(expectedText))return false;
          element.focus();
          const range=document.createRange();
          range.setStart(text,Math.max(1,Math.floor(text.textContent.length/2)));
          range.collapse(true);
          const selection=window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          document.dispatchEvent(new Event('selectionchange'));
          return selection?.anchorNode===text;
        },{index,expectedText});
        assert.equal(selected,true,'caret must be inside '+expectedText);
      };
      await selectRun(0,'Alfa');
      await page.waitForFunction(()=>document.querySelector('input[aria-label="Textstorlek i direktredigering"]')?.value==='32',null,{timeout:5000});
      assert.equal(await size.inputValue(),'32','first run size must follow the caret');
      assert.equal((await color.inputValue()).toLowerCase(),'#cc0000','first run color must follow the caret');
      await selectRun(1,'Beta');
      await page.waitForFunction(()=>document.querySelector('input[aria-label="Textstorlek i direktredigering"]')?.value==='44',null,{timeout:5000});
      assert.equal(await size.inputValue(),'44','second run size must follow the caret');
      assert.equal((await color.inputValue()).toLowerCase(),'#0000cc','second run color must follow the caret');
      await styling.getByRole('button',{name:'Klar'}).click();
      console.log('PASS UX-01 selection-aware format controls',viewport.name);
    }
    const changedElement=page.locator('.editor-canvas-pane .stage .render-element.type-text').first();
    await changedElement.dblclick();
    const again=page.getByRole('group',{name:'Redigera text på bilden'});
    await again.getByRole('textbox',{name:'Redigera objektets text'}).press('Escape');
    assert.equal(await again.count(),0,viewport.name+': Escape should dismiss edit mode');
    assert.deepEqual(errors,[],viewport.name+': no page errors');
    checks.push({viewport:viewport.name,result:'PASS'});
    console.log('PASS inline editing',viewport.name);
    await context.close();
  }
} finally {await browser.close(); server.kill('SIGTERM');}
console.log(JSON.stringify({checks,result:'PASS'},null,2));
