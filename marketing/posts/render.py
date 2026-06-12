# Renders SHISHKA soft-opening posts (1080x1350). Re-run after editing details below.
# Post B/C need menu photos from Supabase storage placed in marketing/posts/_img/ :
#   manakish-zaatar.webp  manakish-lamb.webp  manakish-pumpkin.webp
#   smoothie-1.webp smoothie-2.webp smoothie-3.webp
# (download_assets.sh fetches them once the storage host is allowlisted)
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fruit

W,H=1080,1350
GREEN=(58,74,28); GREEN9=(33,44,14); RED=(182,42,35); CREAM=(245,238,223); CREAM50=(251,248,240); INK=(27,30,20); MUTED=(90,94,80)
FB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FR="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
def f(p,s): return ImageFont.truetype(p,s)
HERE=os.path.dirname(os.path.abspath(__file__)); IMG=os.path.join(HERE,"_img")
def asset(p): return os.path.join(HERE,"../../public/assets",p)

# ----- editable details -----
DATE="sun 14 june · 9am–6pm"; PLACE="soi naya 2, rawai · next to TOPS daily"; OFFER="20% off · first 50 guests"
SOUL="from the SOIL to the SOUL"

def ctext(d,y,t,font,fill,ww=W,ls=0):
    if ls:
        total=sum(d.textlength(c,font=font)+ls for c in t)-ls; x=(ww-total)/2
        for c in t: d.text((x,y),c,font=font,fill=fill); x+=d.textlength(c,font=font)+ls
    else:
        w=d.textlength(t,font=font); d.text(((ww-w)/2,y),t,font=font,fill=fill)

def fit(path,wmax,hmax):
    im=Image.open(path).convert("RGBA")
    r=min(wmax/im.width,hmax/im.height); return im.resize((int(im.width*r),int(im.height*r)),Image.LANCZOS)

def circle(path,size):
    im=Image.open(path).convert("RGB"); im=ImageOps.fit(im,(size,size),Image.LANCZOS)
    mask=Image.new("L",(size,size),0); ImageDraw.Draw(mask).ellipse([0,0,size,size],fill=255)
    out=Image.new("RGBA",(size,size),(0,0,0,0)); out.paste(im,(0,0),mask); return out

def scatter(base, items):
    """items: list of (slice_img, cx, cy, size, rotation) — little fruit accents peeking from edges."""
    for sl,cx,cy,sz,rot in items:
        s=sl.resize((sz,sz),Image.LANCZOS)
        if rot: s=s.rotate(rot,expand=True,resample=Image.BICUBIC)
        base.paste(s,(int(cx-s.width/2),int(cy-s.height/2)),s)

# ================= POST A — announcement (solid green, no photo) =================
img=Image.new("RGB",(W,H),GREEN); d=ImageDraw.Draw(img)
logo=fit(asset("logo-full-white.png"),440,210); img.paste(logo,((W-logo.width)//2,120),logo)
y=120+logo.height+56
ctext(d,y,"seed oil & gluten free",f(FR,32),CREAM,ls=8); y+=86
ctext(d,y,"soft",f(FB,158),CREAM); y+=156
ctext(d,y,"opening",f(FB,158),CREAM); y+=176
ctext(d,y,"rawai · phuket",f(FR,42),CREAM)
yb=890; d.line([(W/2-60,yb),(W/2+60,yb)],fill=CREAM,width=4); yb+=48
ctext(d,yb,DATE,f(FB,54),CREAM); yb+=86
ctext(d,yb,"📍 "+PLACE,f(FR,32),CREAM); yb+=100
pf=f(FB,46); pw=d.textlength(OFFER,font=pf); px=(W-pw)/2-48
d.rounded_rectangle([px,yb,px+pw+96,yb+102],radius=51,fill=RED); d.text(((W-pw)/2,yb+26),OFFER,font=pf,fill=(255,255,255))
ctext(d,H-104,SOUL,f(FR,30),CREAM,ls=4)
# little cut-fruit accents peeking from the edges
F=fruit.make(260)
scatter(img,[
    (F["lime"],       60,  64, 250, -12),
    (F["orange"],   1028, 150, 270,  10),
    (F["watermelon"], 26, 560, 210, -18),
    (F["lemon"],    1060, 600, 220,  16),
    (F["kiwi"],       78,1286, 240,  14),
    (F["blood"],    1018,1296, 230, -10),
])
img.save(os.path.join(HERE,"post-a-announcement.png")); print("post-a OK (green + fruit)")

# ================= POST B — manakish (cream, BIG photos) =================
trio=[("manakish-lamb.webp","lamb"),("manakish-zaatar.webp","za'atar"),("manakish-cheese.webp","chilli cheese")]
if all(os.path.exists(os.path.join(IMG,fn)) for fn,_ in trio):
    b=Image.new("RGB",(W,H),CREAM50); d=ImageDraw.Draw(b)
    y=120
    ctext(d,y,"manakish,",f(FB,108),GREEN); y+=112
    ctext(d,y,"done right",f(FB,108),GREEN); y+=128
    ctext(d,y,"potato & rice base · gluten free · zero seed oils",f(FR,30),MUTED); y+=92
    # big slices, slightly overlapping, center one raised
    cell=400; gap=-34; total=3*cell+2*gap; x0=(W-total)//2; ytop=y+30
    order=[0,2,1]  # draw sides first so the centre overlaps on top
    for i in order:
        fn,lab=trio[i]; sz=cell if i==1 else cell-46
        pic=circle(os.path.join(IMG,fn),sz)
        cx=x0+i*(cell+gap)+(cell-sz)//2; cy=ytop+(0 if i==1 else 70)
        b.paste(pic,(cx,cy),pic)
    for i,(fn,lab) in enumerate(trio):
        lf=f(FB,34); lw=d.textlength(lab,font=lf)
        d.text((x0+i*(cell+gap)+(cell-lw)/2, ytop+cell+30),lab,font=lf,fill=GREEN)
    bh=152; d.rectangle([0,H-bh,W,H],fill=GREEN)
    d.text((64,H-bh+54),"soft opening · sun 14 june",font=f(FB,40),fill=CREAM)
    lg=fit(asset("logo-full-white.png"),240,100); b.paste(lg,(W-lg.width-64,H-bh+(bh-lg.height)//2),lg)
    b.save(os.path.join(HERE,"post-b-manakish.png")); print("post-b OK (big)")
else:
    print("post-b SKIP - needs _img/manakish-{lamb,zaatar,cheese}.webp")

# ================= POST C — smoothies (green) =================
sm=["smoothie-1.webp","smoothie-2.webp","smoothie-3.webp"]
if all(os.path.exists(os.path.join(IMG,fn)) for fn in sm):
    c=Image.new("RGB",(W,H),GREEN); d=ImageDraw.Draw(c)
    lg=fit(asset("logo-full-white.png"),240,100); c.paste(lg,((W-lg.width)//2,120),lg)
    cell=330; gap=36; total=3*cell+2*gap; x0=(W-total)//2; ytop=360
    for i,fn in enumerate(sm):
        sz=cell if i==1 else cell-30
        pic=circle(os.path.join(IMG,fn),sz)
        off=0 if i==1 else 40
        c.paste(pic,(x0+i*(cell+gap)+(0 if i==1 else 15),ytop+off),pic)
    y=780
    ctext(d,y,"from the SOIL",f(FB,96),CREAM); y+=104
    ctext(d,y,"to the SOUL",f(FB,96),CREAM); y+=150
    ctext(d,y,"smoothies, juices & coffee — real, unprocessed,",f(FR,34),CREAM); y+=48
    ctext(d,y,"gluten-free. food that loves you back.",f(FR,34),CREAM); y+=120
    ctext(d,y,"soft opening · sun 14 june · rawai",f(FB,40),CREAM)
    c.save(os.path.join(HERE,"post-c-story.png")); print("post-c OK (smoothies)")
else:
    print("post-c SKIP - needs _img/smoothie-{1,2,3}.webp")
