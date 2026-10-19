"""Executable PPD contract reference; not the browser importer or a renderer."""
from pathlib import Path
import base64
import copy
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

import rfc8785
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
VERSION = '0.3.1'
FEATURES = {'ppd.core', 'ppd.rich-text', 'ppd.masters', 'ppd.semantic-diagram',
            'ppd.equation', 'ppd.vector-path'}


class ContractError(ValueError):
    def __init__(self, code, path=''):
        self.code, self.path = code, path
        super().__init__(f'{code}: {path}')


def fail(code, path=''):
    raise ContractError(code, path)


def load_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                fail('JSON_DUPLICATE_KEY', key)
            result[key] = value
        return result
    def constant(value):
        fail('JSON_NUMBER', value)
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=constant)


def source_hash(model):
    # Build is derived, and therefore excluded in its entirety, not just the hash.
    return hashlib.sha256(rfc8785.dumps({k: v for k, v in model.items() if k != 'build'})).hexdigest()


def scenes(model):
    for master in model.get('masters', []):
        yield master
        yield from master.get('layouts', [])
    yield from model.get('components', [])
    for slide in model.get('slides', []):
        yield slide['view']


def elements(model):
    for scene in scenes(model):
        yield from scene.get('elements', [])


def walk(value, path=''):
    yield path, value
    if isinstance(value, dict):
        for k, v in value.items():
            if k in ('extensions', 'generation', 'provenance'):
                continue
            yield from walk(v, path + '/' + k)
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from walk(v, path + '/' + str(i))


def negotiate(model):
    """Compatibility classification only. Read-only is never schema/safety PASS.

    A future browser must retain original bytes and validate any fallback before
    showing it. This function does not render, mutate or authorize any payload.
    """
    if model.get('format') != 'ppd':
        return {'mode': 'blocked', 'code': 'FORMAT'}
    if set(model.get('document', {}).get('featureRequirements', [])) - FEATURES:
        return {'mode': 'blocked', 'code': 'REQUIRED_FEATURE'}
    version = model.get('schemaVersion')
    if version not in ('0.3.0', VERSION):
        return {'mode': 'read_only', 'code': 'UNVERIFIED_VERSION'}
    minimum = model.get('minReaderVersion', '0.0.0')
    if not re.fullmatch(r'\d+\.\d+\.\d+', minimum):
        return {'mode': 'blocked', 'code': 'READER_VERSION'}
    if tuple(map(int, minimum.split('.'))) > (0, 3, 1):
        return {'mode': 'blocked', 'code': 'READER_TOO_OLD'}
    schema = json.loads((ROOT/'schemas/ppd.schema.json').read_text())
    types = set(schema['$defs']['element']['properties']['type']['enum'])
    for el in elements(model):
        if el.get('type') not in types:
            return {'mode': 'read_only', 'code': 'UNKNOWN_OBJECT'}
        if el.get('chartType') in ('area', 'scatter', 'combo'):
            return {'mode': 'read_only', 'code': 'CHART_OUTSIDE_EDITOR_PROFILE'}
    return {'mode': 'editable_candidate', 'code': 'VALIDATION_REQUIRED'}


def migrate_030(model):
    original = json.loads((ROOT/'reference/ppd.schema.json').read_text())
    if list(Draft202012Validator(original, format_checker=FormatChecker()).iter_errors(model)):
        fail('SOURCE_SCHEMA')
    if negotiate(model)['mode'] != 'editable_candidate':
        fail('MIGRATION_UNSUPPORTED')
    result = copy.deepcopy(model)
    for el in elements(result):
        if 'box' in el:
            if 'geometry' in el and el['box'] != el['geometry']:
                fail('GEOMETRY_CONFLICT', el['id'])
            el['geometry'] = el.pop('box')
    result['schemaVersion'] = VERSION
    # Never carry a stale rendering/hash over a canonical model change.
    result.pop('build', None)
    validate(result)
    return result, {'from': '0.3.0', 'to': VERSION,
                    'changes': ['box_to_geometry', 'derived_build_invalidated'],
                    'original_unchanged': True}


def unique(items, path):
    ids = [x['id'] for x in items]
    if len(ids) != len(set(ids)):
        fail('DUPLICATE_ID', path)
    return {x['id']: x for x in items}


def acyclic(graph, code, path):
    done, visiting = set(), set()
    def visit(node):
        if node in visiting:
            fail(code, path)
        if node in done:
            return
        visiting.add(node)
        for target in graph.get(node, []):
            visit(target)
        visiting.remove(node)
        done.add(node)
    for node in graph:
        visit(node)


def safe_svg(svg, path):
    # Conservative contract rejection, NOT a complete production sanitizer.
    if re.search(r'<!\s*(?:DOCTYPE|ENTITY)', svg, re.I):
        fail('UNSAFE_SVG', path)
    try:
        node = ET.fromstring(svg)
    except ET.ParseError:
        fail('SVG_XML', path)
    allowed = {'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
               'polygon', 'title', 'desc', 'defs', 'clipPath', 'linearGradient',
               'radialGradient', 'stop'}
    attrs = {'id', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2',
             'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'stroke',
             'stroke-width', 'fill-rule', 'opacity', 'transform', 'offset',
             'stop-color', 'stop-opacity', 'clip-path', 'gradientUnits', 'gradientTransform'}
    if node.tag.split('}')[-1] != 'svg':
        fail('UNSAFE_SVG', path)
    for item in node.iter():
        if item.tag.split('}')[-1] not in allowed:
            fail('UNSAFE_SVG', path)
        for k, v in item.attrib.items():
            if k not in attrs or (re.search(r'url\s*\(', v, re.I) and not re.fullmatch(r'url\(#[A-Za-z0-9_-]+\)', v)):
                fail('UNSAFE_SVG', path)


def validate(model, profile='core'):
    schema = json.loads((ROOT/'schemas/ppd.schema.json').read_text())
    errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(model), key=lambda e: str(list(e.path)))
    if errors:
        fail('SCHEMA', '/'.join(map(str, errors[0].path)))
    # JCS additionally rejects non-finite/unsafe integer/unicode inputs.
    try:
        source_hash(model)
        rfc8785.dumps(model)
    except (rfc8785.CanonicalizationError, UnicodeError):
        fail('CANONICAL_JSON')
    slides = unique(model['slides'], '/slides')
    masters = unique(model.get('masters', []), '/masters')
    comps = unique(model.get('components', []), '/components')
    all_elements = list(elements(model))
    unique(all_elements, '/elements')
    sections = unique(model['presentation'].get('sections', []), '/sections')
    assets = model['assets']
    styles = model['theme'].get('styles', {})
    if model['presentation'].get('initialSlideId', next(iter(slides))) not in slides:
        fail('SLIDE_REF')
    default_master = model['document'].get('defaultMasterId')
    if default_master and default_master not in masters:
        fail('MASTER_REF')
    default_layout = model['document'].get('defaultLayoutId')
    if default_layout and (not default_master or default_layout not in {x['id'] for x in masters[default_master].get('layouts', [])}):
        fail('LAYOUT_REF')
    for master in masters.values():
        unique(master.get('layouts', []), 'master/layouts')
        if master.get('themeRef', model['theme']['id']) != model['theme']['id']:
            fail('THEME_REF')
        for layout in master.get('layouts', []):
            unique(layout.get('placeholders', []), 'layout/placeholders')
    for comp in comps.values():
        unique(comp.get('slots', []), 'component/slots')
    for scene in scenes(model):
        els = {e['id']: e for e in scene.get('elements', [])}
        parents, graph = {}, {}
        for el in els.values():
            for key in ('startAnchor', 'endAnchor'):
                if key in el and el[key].get('elementId') not in els:
                    fail('ANCHOR_REF', el['id'])
            if 'styleRef' in el and el['styleRef'] not in styles:
                fail('STYLE_REF', el['id'])
            if 'componentId' in el and el['componentId'] not in comps:
                fail('COMPONENT_REF', el['id'])
            if el['type'] == 'group':
                graph[el['id']] = el['children']
                if len(el['children']) != len(set(el['children'])):
                    fail('MULTIPLE_PARENT', el['id'])
                for child in el['children']:
                    if child not in els:
                        fail('CHILD_REF', child)
                    if child in parents:
                        fail('MULTIPLE_PARENT', child)
                    parents[child] = el['id']
        acyclic(graph, 'GROUP_CYCLE', 'scene')
        order = scene.get('accessibilityOrder', [])
        if len(order) != len(set(order)) or any(x not in els for x in order):
            fail('READING_ORDER')
    # Component references must not form an expansion loop.
    acyclic({cid: [e['componentId'] for e in c.get('elements', []) if 'componentId' in e]
             for cid, c in comps.items()}, 'COMPONENT_CYCLE', 'components')
    for slide in slides.values():
        if 'sectionId' in slide and slide['sectionId'] not in sections:
            fail('SECTION_REF')
        mid = slide.get('masterId', default_master)
        if mid and mid not in masters:
            fail('MASTER_REF')
        lid = slide.get('layoutId', default_layout)
        layouts = {x['id']: x for x in masters[mid]['layouts']} if mid else {}
        if lid and lid not in layouts:
            fail('LAYOUT_REF')
        blocks = []
        def collect(items):
            for block in items:
                blocks.append(block)
                collect(block.get('children', []))
        collect(slide['content'].get('blocks', []))
        block_map = unique(blocks, 'slide/content')
        els = {e['id']: e for e in slide['view']['elements']}
        def content_ref(ref):
            if ref in block_map:
                return
            # Explicit # separates a field from an ID which may itself contain dots.
            bid, sep, field = ref.partition('#')
            if not sep or bid not in block_map or field not in ('text', 'title', 'body') or field not in block_map[bid]:
                fail('CONTENT_REF', ref)
        for el in els.values():
            if 'contentRef' in el:
                content_ref(el['contentRef'])
        bindings = slide.get('placeholderBindings', [])
        if len({x['placeholderId'] for x in bindings}) != len(bindings):
            fail('BINDING_DUPLICATE')
        phs = {x['id'] for x in layouts.get(lid, {}).get('placeholders', [])}
        for binding in bindings:
            if binding['placeholderId'] not in phs:
                fail('PLACEHOLDER_REF')
            if 'contentRef' in binding:
                content_ref(binding['contentRef'])
            if 'elementId' in binding and binding['elementId'] not in els:
                fail('ELEMENT_REF')
        for f in slide.get('delivery', {}).get('fragments', []):
            if f['elementId'] not in els:
                fail('FRAGMENT_REF')
    for el in all_elements:
        if el.get('type') == 'chart':
            dataset = el['dataset']
            unique(dataset.get('columns', []), 'dataset/columns')
            unique(dataset.get('series', []), 'dataset/series')
            if 'columns' in dataset and any(len(row) != len(dataset['columns']) for row in dataset.get('rows', [])):
                fail('DATASET_SHAPE', el['id'])
            if 'categories' in dataset and any(len(series['values']) != len(dataset['categories']) for series in dataset.get('series', [])):
                fail('DATASET_SHAPE', el['id'])
        if el['type'] == 'semanticDiagram':
            d = el['semanticDiagram']
            nodes = unique(d['nodes'], 'diagram/nodes')
            unique(d.get('edges', []), 'diagram/edges')
            graph = {}
            for edge in d.get('edges', []):
                if edge['from'] not in nodes or edge['to'] not in nodes:
                    fail('DIAGRAM_REF', el['id'])
                graph.setdefault(edge['from'], []).append(edge['to'])
            if d['kind'] in ('hierarchy', 'org-chart'):
                acyclic(graph, 'HIERARCHY_CYCLE', el['id'])
        if el['type'] == 'vectorPath' and el['vectorPath']['format'] == 'svg-document':
            safe_svg(el['vectorPath']['svg'], el['id'])
        for action in el.get('actions', []):
            kind = action['kind']
            required = {'navigate-slide': 'targetId', 'open-url': 'url',
                        'show-hide': 'targetId', 'play-media': 'targetId', 'set-state': 'stateKey'}[kind]
            if required not in action:
                fail('ACTION_PAYLOAD', el['id'])
            if kind == 'navigate-slide' and action['targetId'] not in slides:
                fail('ACTION_REF', el['id'])
            if kind in ('show-hide', 'play-media') and action['targetId'] not in {e['id'] for e in all_elements}:
                fail('ACTION_REF', el['id'])
            if kind == 'play-media' and next(e for e in all_elements if e['id'] == action['targetId'])['type'] != 'media':
                fail('ACTION_MEDIA_TYPE', el['id'])
        geometry = el.get('geometry')
        if geometry and geometry.get('unit', 'logical') != 'logical':
            fail('GEOMETRY_UNIT', el['id'])
    for path, value in walk(model):
        if path.endswith('/text') and isinstance(value, dict) and 'paragraphs' in value:
            unique(value['paragraphs'], path + '/paragraphs')
    # Known resource references throughout typed document areas, never in extensions.
    def typed(value, path=''):
        if isinstance(value, dict):
            for k, v in value.items():
                if k in ('extensions', 'generation', 'provenance'):
                    continue
                if k in ('assetRef', 'posterAssetRef', 'fallbackAssetRef', 'renderedAssetRef', 'captionsAssetRef') and v not in assets:
                    fail('ASSET_REF', path + '/' + k)
                if k in ('link', 'url') and isinstance(v, str):
                    if re.search(r'[\x00-\x20\\]', v) or urlsplit(v).scheme.lower() not in ('https', 'http', 'mailto', 'tel'):
                        fail('UNSAFE_URL', path + '/' + k)
                typed(v, path + '/' + k)
        elif isinstance(value, list):
            for i, v in enumerate(value):
                typed(v, path + '/' + str(i))
    typed(model)
    if profile == 'offline-single-file':
        if not model.get('build', {}).get('selfContained') or 'provenance' not in model:
            fail('PUBLISH_METADATA')
        if any('geometry' not in e for e in all_elements):
            fail('PUBLISH_GEOMETRY')
        total = 0
        for aid, asset in assets.items():
            if asset['storage'] != 'embedded':
                fail('EXTERNAL_RESOURCE', aid)
            match = re.fullmatch(r'data:([^;,]+);base64,([A-Za-z0-9+/=]*)', asset.get('uri', ''))
            if not match or match[1] != asset['mimeType']:
                fail('ASSET_ENCODING', aid)
            try:
                raw = base64.b64decode(match[2], validate=True)
            except ValueError:
                fail('ASSET_ENCODING', aid)
            if hashlib.sha256(raw).hexdigest() != asset.get('sha256'):
                fail('ASSET_HASH', aid)
            total += len(raw)
            if len(raw) > 10 * 1024 * 1024 or total > 25 * 1024 * 1024:
                fail('ASSET_LIMIT', aid)
            if asset['mimeType'] not in ('image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'font/woff2'):
                fail('ASSET_MIME', aid)
            if asset['mimeType'] == 'image/svg+xml':
                safe_svg(raw.decode('utf-8'), aid)
        if model['build'].get('sourceModelHash') != source_hash(model):
            fail('MODEL_HASH')
    elif profile != 'core':
        fail('UNKNOWN_PROFILE')
    return {'result': 'PASS', 'profile': profile, 'scope': 'data_contract_only'}
