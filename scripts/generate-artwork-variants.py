"""Authoring-only tool. Requires Pillow with WebP support; never alters originals."""
from pathlib import Path
from PIL import Image
import hashlib, json
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]/'assets'/'museum'
LIMIT=1536
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
folder=ROOT/'variants'/'balanced'
folder.mkdir(parents=True,exist_ok=True)
def build(a):
    src=ROOT/a['image']
    if hashlib.sha256(src.read_bytes()).hexdigest()!=a['sha256']:
        raise ValueError(f'Original checksum mismatch: {a["id"]}')
    if max(a['width'],a['height'])<=LIMIT:
        return None
    rel=f'variants/balanced/{a["id"]}.webp'
    dst=ROOT/rel
    with Image.open(src) as im:
        if im.size!=(a['width'],a['height']):
            raise ValueError(f'Original dimensions mismatch: {a["id"]}')
        icc=im.info.get('icc_profile')
        im=im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
        im.thumbnail((LIMIT,LIMIT),Image.Resampling.LANCZOS)
        options={'quality':90,'method':4}
        if icc: options['icc_profile']=icc
        im.save(dst,'WEBP',**options)
        width,height=im.size
    b=dst.read_bytes()
    return {'artworkId':a['id'],'image':rel,'width':width,'height':height,'imageBytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'sourceSha256':a['sha256'],'changes':'Resized from original catalog WebP with Lanczos and re-encoded as WebP quality 90. Original attribution and license apply; see manifest.json.'}
with ThreadPoolExecutor(max_workers=4) as pool:
    results=[r for r in pool.map(build,[a for a in manifest['artworks'] if a['displayByDefault']]) if r]
index={'schema':'blcklab-museum-texture-variants@1','profile':'balanced','maxEdge':LIMIT,'artworks':results}
(ROOT/'texture-variants.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(results)} balanced textures; {sum(r["imageBytes"] for r in results):,} encoded bytes')
