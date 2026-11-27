"""Original procedural floor textures; optional authoring tool (numpy + Pillow).
No external photographs or licenses. The checked-in WebP files are runtime assets.
"""
from pathlib import Path
import numpy as np
from PIL import Image

N = 1024
OUT = Path(__file__).resolve().parents[1] / 'assets/architecture/floors'
OUT.mkdir(parents=True, exist_ok=True)
y, x = np.mgrid[0:N, 0:N].astype(np.float64) / N
TAU = 2*np.pi
rng = np.random.default_rng(1729)

def noise(freq, seed):
    # Periodic smooth value noise, evaluated with wraparound at both tile edges.
    a = np.random.default_rng(seed).normal(0, 1, (freq, freq))
    X, Y = x*freq, y*freq
    i, j = np.floor(X).astype(int), np.floor(Y).astype(int)
    u, v = X-i, Y-j
    u, v = u*u*(3-2*u), v*v*(3-2*v)
    return (a[j%freq,i%freq]*(1-u)+a[j%freq,(i+1)%freq]*u)*(1-v)+(a[(j+1)%freq,i%freq]*(1-u)+a[(j+1)%freq,(i+1)%freq]*u)*v

def save(name, base, variation):
    rgb = np.clip(np.asarray(base)[None,None,:]+variation,0,255).astype(np.uint8)
    Image.fromarray(rgb).save(OUT/(name+'.webp'), 'WEBP', quality=91, method=6)

# A rotated true herringbone tessellation: length=4 widths, with alternating
# horizontal/vertical boards. Integer lattice period 8 yields a seamless square.
u, v = 8*(x+y), 8*(y-x)
i,j=np.floor(u).astype(int),np.floor(v).astype(int)
d=(i-j)%8
horizontal=d<4
start_i=np.where(horizontal,i-d,i)
start_j=np.where(horizontal,j,j-(7-d))
lu,lv=u-start_i,v-start_j
along=np.where(horizontal,lu,lv)
across=np.where(horizontal,lv,lu)
board=np.random.default_rng(47).uniform(-20,20,(8,8))[start_j%8,start_i%8]
edge=np.minimum.reduce([along,4-along,across,1-across])
seam=np.exp(-np.maximum(edge,0)*160)
# Local grain follows each board, including end-grain color variation.
warp=.07*np.sin(along*2.3+board)+.024*np.sin(along*8.1+board*.3)
grain=5*np.sin(TAU*(across*12+warp))+3*np.sin(TAU*(across*31+warp*2))+2*np.sin(TAU*(across*58+warp*3))
fiber=grain+2*noise(160,5)+2*noise(48,8)
wood=(board+fiber-62*seam+6*np.exp(-np.maximum(edge-.018,0)*105))
save('oak-herringbone',[139,101,65],wood[:,:,None]*np.array([1,.85,.66]))

# Marble with broad warm clouds and fine, irregular, branching mineral veins.
cloud=noise(4,13)*5+noise(12,14)*3+noise(40,15)*1.3
phase=TAU*(2*x+y)+noise(3,16)*1.0+noise(9,17)*.40+noise(28,18)*.09
v1=np.exp(-np.abs(np.sin(phase))**1.45*14)
phase2=phase+.30+.34*noise(6,19)
v2=np.exp(-np.abs(np.sin(phase2))**1.25*31)
vein=-(17*v1+14*v2)*(np.clip(.85+.22*noise(5,20),.3,1.2))
# Subtle square slab joints at one-meter intervals (2 slabs in the tile).
seamdist=np.minimum(np.abs(np.sin(TAU*x)),np.abs(np.sin(TAU*y)))
seam=np.exp(-seamdist*105)
save('ivory-marble',[199,191,177],(cloud+vein-26*seam)[:,:,None]*np.array([1,.98,.88]))

# Two-by-two limestone and basalt tiles, with restrained natural grain and grout.
for name,base,seed in [('pale-limestone',[181,174,160],30),('charcoal-stone',[82,87,88],50)]:
    tilevar=np.random.default_rng(seed).uniform(-6,6,(2,2))[np.floor(2*y).astype(int),np.floor(2*x).astype(int)]
    micro=noise(150,seed+1)*3.2+noise(64,seed+2)*2.4
    mottling=noise(6,seed+3)*3+noise(22,seed+4)*2.5
    dist=np.minimum(np.abs(np.sin(TAU*x)),np.abs(np.sin(TAU*y)))
    seam=np.exp(-dist*95)
    bevel=np.exp(-np.abs(dist-.025)*130)
    save(name,base,(tilevar+micro+mottling-22*seam+3*bevel)[:,:,None]*np.array([1,1,1]))
print('Generated:', ', '.join(f.name for f in sorted(OUT.glob('*.webp'))))
