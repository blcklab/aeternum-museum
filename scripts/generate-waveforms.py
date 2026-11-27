"""Optional authoring tool. Requires ffmpeg; not a runtime dependency."""
import array, json, math, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parents[1] / 'assets/audio'
manifest_path = root / 'soundscapes.json'
manifest = json.loads(manifest_path.read_text())
for track in manifest['tracks']:
    if sys.argv[1:] and track['id'] not in sys.argv[1:]: continue
    file = track['file']
    if not file.endswith('.mp3') or pathlib.Path(file).name != file: raise ValueError(file)
    audio = array.array('h', subprocess.check_output(['ffmpeg','-v','error','-i',str(root/file),'-t','900','-ac','1','-ar','6000','-f','s16le','-']))
    if sys.byteorder != 'little': audio.byteswap()
    peaks = [round(min(1, max(abs(v) for v in audio[i:i+100])/32768),3) for i in range(0,len(audio),100)]
    name = file.removesuffix('.mp3') + '.waveform.json'
    (root/name).write_text(json.dumps({'schema':'anyo-audio-waveform@1','rate':60,'duration':len(audio)/6000,'peaks':peaks},separators=(',',':'))+'\n')
    track['waveform'] = name
    print(f'{file}: {len(peaks)} samples, {len(audio)/6000:.2f}s')
manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
