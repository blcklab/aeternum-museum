"""Generate original, short mono surface-specific footfall samples. Authoring only."""
from pathlib import Path
import numpy as np, wave, tempfile, subprocess
out=Path(__file__).resolve().parents[1]/'assets/audio'
sr=24000; n=int(sr*.40); t=np.arange(n)/sr; f=np.fft.rfftfreq(n,1/sr)
for i,(name,center,spread,thud,decay) in enumerate([('marble',1600,1400,115,.050),('oak',700,650,92,.065),('limestone',1150,1050,108,.048),('stone',1900,1500,125,.055)]):
    for v in range(2):
        rng=np.random.default_rng(340+i*10+v)
        noise=np.fft.irfft(np.fft.rfft(rng.normal(size=n))*np.exp(-.5*((f-center)/spread)**2),n)
        noise/=max(abs(noise))
        env=(1-np.exp(-t/.003))*np.exp(-t/decay)
        toe=np.maximum(t-.070,0); toe_env=(1-np.exp(-toe/.004))*np.exp(-toe/.036)
        tone=np.sin(2*np.pi*(thud*t-55*t*t))*np.exp(-t/.028)*(1-np.exp(-t/.003))
        samples=(noise*(env+.30*toe_env)+.38*tone)*np.minimum(1,(.4-t)/.035)
        samples*=.46/max(abs(samples))
        with tempfile.TemporaryDirectory() as tmp:
            wav=Path(tmp)/'step.wav'
            with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((samples*32767).astype('<i2').tobytes())
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','4',str(out/f'step-{name}-{v+1}.ogg')],check=True)
