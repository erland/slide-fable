"""Verify browser-produced PDFs/PPTX. Requires pypdf for PDF inspection."""
from pathlib import Path
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pypdf import PdfReader

root=Path(sys.argv[1])
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
checks=[]
def check(name,condition):
    if not condition:raise AssertionError(name)
    checks.append({'name':name,'result':'PASS'})
for device in ['desktop','tablet','phone']:
    pdf=PdfReader(root/(device+'.pdf'))
    check(device+':pdf-page-count',len(pdf.pages)==3)
    check(device+':pdf-aspect',all(abs(float(p.mediabox.width)/float(p.mediabox.height)-16/9)<0.001 for p in pdf.pages))
    text='\n'.join(p.extract_text() or '' for p in pdf.pages)
    check(device+':searchable-swedish','räksmörgås' in text and 'åäö ÅÄÖ' in text and 'Glaseffekt' in text)
    check(device+':no-blank-pdf-pages',all(len(p.extract_text() or '')>40 for p in pdf.pages))
    with zipfile.ZipFile(root/(device+'.pptx')) as z:
        check(device+':pptx-zip',z.testzip() is None)
        for name in z.namelist():
            if name.endswith(('.xml','.rels')):ET.fromstring(z.read(name))
        slide1=ET.fromstring(z.read('ppt/slides/slide1.xml'))
        slide2=ET.fromstring(z.read('ppt/slides/slide2.xml'))
        slide3=ET.fromstring(z.read('ppt/slides/slide3.xml'))
        check(device+':native-text',bool(slide1.findall('.//p:sp/p:txBody/a:p/a:r/a:t',ns)))
        check(device+':native-shape',bool(slide2.findall('.//p:sp/p:spPr/a:prstGeom',ns)))
        check(device+':native-table',len(slide2.findall('.//a:tbl',ns))==1)
        check(device+':effect-raster-and-separate-text',len(slide3.findall('.//p:pic',ns))==1 and len(slide3.findall('.//p:sp/p:txBody',ns))>0)
        titles=[x.text for x in slide3.findall('.//a:t',ns)]
        check(device+':editable-glass-title',any('Glaseffekt' in (t or '') for t in titles))
reports=json.loads((root/'export-report.json').read_text())
model=json.loads((root/'model.json').read_text())
from ppd_contract import validate
validate(model)
check('sample-model-contract',True)
for fmt in ['pdf','pptx']:
    for s in model['slides']:
        for el in s['view']['elements']:
            check(fmt+':report:'+el['id'],any(r['format']==fmt and r['slideId']==s['id'] and r['elementId']==el['id'] for r in reports))
check('glass-fallback-explicit',all(r['status']=='rasterized' and r['reason'] for r in reports if r['elementId']=='glass'))
browser=json.loads((root/'browser-results.json').read_text())
check('browser-probes-passed',len(browser['checks'])>=22 and all(x['result']=='PASS' for x in browser['checks']))
result={'result':'PASS','scope':'PDF and OOXML structure; no Office application test','checks':checks,'check_count':len(checks)}
print(json.dumps(result,ensure_ascii=False,indent=2))
