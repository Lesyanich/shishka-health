# Procedural cut-fruit slice motifs (transparent PNGs) for accenting posts.
import math
from PIL import Image, ImageDraw
SS=4  # supersample for smooth edges

def _canvas(size):
    return Image.new("RGBA",(size*SS,size*SS),(0,0,0,0))

def _fin(img,size):
    return img.resize((size,size),Image.LANCZOS)

def citrus(size, rind, flesh, pith=(255,251,242), segs=10):
    im=_canvas(size); d=ImageDraw.Draw(im); S=size*SS
    d.ellipse([0,0,S-1,S-1],fill=rind)
    m=S*0.06; d.ellipse([m,m,S-m,S-m],fill=pith)
    m2=S*0.105; d.ellipse([m2,m2,S-m2,S-m2],fill=flesh)
    c=S/2; R=S*0.40
    for i in range(segs):
        a=2*math.pi*i/segs
        d.line([c,c,c+R*math.cos(a),c+R*math.sin(a)],fill=pith,width=int(S*0.012))
    d.ellipse([c-S*0.028,c-S*0.028,c+S*0.028,c+S*0.028],fill=pith)
    return _fin(im,size)

def watermelon(size):
    im=_canvas(size); d=ImageDraw.Draw(im); S=size*SS; c=S/2
    d.ellipse([0,0,S-1,S-1],fill=(46,86,38))
    for r,col in [(0.95,(123,164,74)),(0.90,(247,243,229)),(0.86,(214,58,52))]:
        m=S*(1-r)/2; d.ellipse([m,m,S-m,S-m],fill=col)
    for i in range(7):
        a=2*math.pi*i/7 - 0.3; rr=S*0.26
        x=c+rr*math.cos(a); y=c+rr*math.sin(a)
        s=S*0.018; d.ellipse([x-s,y-s*1.6,x+s,y+s*1.6],fill=(35,30,24))
    return _fin(im,size)

def kiwi(size):
    im=_canvas(size); d=ImageDraw.Draw(im); S=size*SS; c=S/2
    d.ellipse([0,0,S-1,S-1],fill=(120,92,52))
    m=S*0.05; d.ellipse([m,m,S-m,S-m],fill=(120,150,70))
    d.ellipse([c-S*0.12,c-S*0.12,c+S*0.12,c+S*0.12],fill=(238,243,224))
    for i in range(16):
        a=2*math.pi*i/16; rr=S*0.30
        x=c+rr*math.cos(a); y=c+rr*math.sin(a); s=S*0.010
        d.ellipse([x-s,y-s,x+s,y+s],fill=(25,22,18))
    return _fin(im,size)

# palette of ready slices
def make(size):
    return {
        "lime":      citrus(size,(86,128,40),(180,214,120)),
        "lemon":     citrus(size,(214,182,40),(248,232,128)),
        "orange":    citrus(size,(214,120,30),(246,176,72)),
        "blood":     citrus(size,(200,70,40),(214,86,70)),
        "grapefruit":citrus(size,(224,150,120),(238,128,120)),
        "watermelon":watermelon(size),
        "kiwi":      kiwi(size),
    }
