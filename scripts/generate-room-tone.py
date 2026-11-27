"""Original periodic filtered noise loops; numpy and ffmpeg only for authoring."""
from pathlib import Path
import numpy as np, subprocess, wave, tempfile
out=Path(__file__).resolve().parents[1]/'assets/audio'; out.mkdir(exist_ok=True)
sr=24000;n=sr*24;f=np.fft.rfftfreq(n,1/sr)
for seed,(name,center,width) in enumerate([('hall',170,210),('gallery',95,120),('science',290,260)],11):
    rng=np.random.default_rng(seed)
    spectrum=(rng.normal(size=len(f))+1j*rng.normal(size=len(f)))*np.exp(-((f-center)/width)**2)*(f/(f+30))
    spectrum[0]=0; samples=np.fft.irfft(spectrum,n);samples*=.13/max(abs(samples))
    with tempfile.TemporaryDirectory() as tmp:
        wav=Path(tmp)/'tone.wav'
        with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((samples*32767).astype('<i2').tobytes())
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','3',str(out/f'room-{name}.ogg')],check=True)
