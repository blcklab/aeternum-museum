"""Authoring only: generate mobile artwork derivatives from verified originals."""
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import hashlib, json
root=Path(__file__).resolve().parents[1]/'assets/museum'
artworks=json.loads((root/'manifest.json').read_text())['artworks']
profiles={'mobile':(1024,86),'mobile-low':(768,84)}
def generate(a):
    src=root/a['image']
    assert hashlib.sha256(src.read_bytes()).hexdigest()==a['sha256'],a['id']
    result={}
    with Image.open(src) as original:
        assert original.size==(a['width'],a['height'])
        for profile,(edge,quality) in profiles.items():
            if max(original.size)<=edge: continue
            im=original.convert('RGBA' if 'A' in original.getbands() else 'RGB')
            im.thumbnail((edge,edge),Image.Resampling.LANCZOS)
            rel=f'variants/{profile}/{a["id"]}.webp'
            dst=root/rel; dst.parent.mkdir(parents=True,exist_ok=True)
            options={'quality':quality,'method':4}
            if original.info.get('icc_profile'): options['icc_profile']=original.info['icc_profile']
            im.save(dst,'WEBP',**options)
            b=dst.read_bytes()
            result[profile]={'artworkId':a['id'],'image':rel,'width':im.width,'height':im.height,'imageBytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'sourceSha256':a['sha256']}
    return result
with ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(generate,[a for a in artworks if a['displayByDefault']]))
index={'schema':'blcklab-museum-mobile-textures@1','profiles':{p:{'maxEdge':edge,'quality':q,'artworks':[r[p] for r in results if p in r]} for p,(edge,q) in profiles.items()}}
(root/'mobile-textures.json').write_text(json.dumps(index,indent=2)+'\n')
for p,v in index['profiles'].items(): print(p,len(v['artworks']),sum(a['imageBytes'] for a in v['artworks']))
