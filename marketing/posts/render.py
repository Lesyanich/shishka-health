# Renders SHISHKA soft-opening posts (1080x1350). Re-run after editing details below.
from PIL import Image, ImageDraw, ImageFont, ImageOps

W,H=1080,1350
GREEN=(58,74,28); GREEN9=(33,44,14); RED=(182,42,35); CREAM=(245,238,223); CREAM50=(251,248,240); INK=(27,30,20); MUTED=(90,94,80)
FB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FR="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
def f(p,s): return ImageFont.truetype(p,s)

# ----- editable details -----
DATE="sun 14 june · 9am–6pm"; PLACE="soi naya 2, rawai · next to tops daily"; OFFER="20% off · first 50 guests"

def ctext(d,y,t,font,fill,ww=W,ls=0):
    if ls:
        total=sum(d.textlength(c,font=font)+ls for c in t)-ls; x=(ww-total)/2
        for c in t: d.text((x,y),c,font=font,fill=fill); x+=d.textlength(c,font=font)+ls
    else:
        w=d.textlength(t,font=font); d.text(((ww-w)/2,y),t,font=font,fill=fill)

def fit_alpha(path,wmax,hmax):
    im=Image.open(path).convert("RGBA")
    r=min(wmax/im.width,hmax/im.height); im=im.resize((int(im.width*r),int(im.height*r)),Image.LANCZOS)
    return im

# ================= POST A — announcement (photo) =================
bg=ImageOps.fit(Image.open("public/assets/hero-saladbar.jpg").convert("RGB"),(W,H),Image.LANCZOS)
wash=Image.new("RGBA",(W,H)); wd=ImageDraw.Draw(wash)
for y in range(H):
    t=y/H; a=int(150-60*(t/0.4)) if t<0.4 else int(150*(1-t)+228*t)
    wd.line([(0,y),(W,y)],fill=(*GREEN9,max(70,min(232,a))))
img=Image.alpha_composite(bg.convert("RGBA"),wash).convert("RGB"); d=ImageDraw.Draw(img)
logo=fit_alpha("public/assets/logo-full-white.png",420,200); img.paste(logo,((W-logo.width)//2,96),logo)
y=96+logo.height+44
ctext(d,y,"seed oil & gluten free",f(FR,32),CREAM,ls=8); y+=78
ctext(d,y,"soft",f(FB,152),CREAM); y+=150
ctext(d,y,"opening",f(FB,152),CREAM); y+=170
ctext(d,y,"rawai · phuket",f(FR,42),CREAM)
yb=908; d.line([(W/2-60,yb),(W/2+60,yb)],fill=CREAM,width=4); yb+=46
ctext(d,yb,DATE,f(FB,52),CREAM); yb+=82
ctext(d,yb,"📍 "+PLACE,f(FR,32),CREAM); yb+=96
pf=f(FB,44); pw=d.textlength(OFFER,font=pf); px=(W-pw)/2-46
d.rounded_rectangle([px,yb,px+pw+92,yb+98],radius=49,fill=RED); d.text(((W-pw)/2,yb+24),OFFER,font=pf,fill=(255,255,255))
ctext(d,H-100,"from the soil to the soul",f(FR,30),CREAM,ls=6)
img.save("marketing/posts/post-a-announcement.png"); print("post-a")

# ================= POST B — manakish (cream, no white behind pics) =================
b=Image.new("RGB",(W,H),CREAM50); d=ImageDraw.Draw(b)
y=128
ctext(d,y,"made daily",f(FR,32),GREEN,ls=8); y+=82
ctext(d,y,"manakish,",f(FB,112),GREEN); y+=116
ctext(d,y,"done right",f(FB,112),GREEN); y+=140
ctext(d,y,"sourdough base · clean ingredients · zero seed oils",f(FR,32),MUTED); y+=130
imgs=["menu/manakish-zaatar.png","menu/manakish-cheese-olive.png","menu/manakish-beef.png"]
labels=["za'atar","cheese & olive","beef"]
cell=300; gap=40; total=3*cell+2*gap; x0=(W-total)//2
for i,(p,lab) in enumerate(zip(imgs,labels)):
    pic=fit_alpha("public/assets/"+p,cell,cell)
    cx=x0+i*(cell+gap)+(cell-pic.width)//2
    b.paste(pic,(cx,y+(cell-pic.height)//2),pic)
    lf=f(FB,32); lw=d.textlength(lab,font=lf); d.text((x0+i*(cell+gap)+(cell-lw)/2,y+cell+20),lab,font=lf,fill=GREEN)
bh=150; d.rectangle([0,H-bh,W,H],fill=GREEN)
d.text((64,H-bh+52),"soft opening · sun 14 june",font=f(FB,40),fill=CREAM)
lg=fit_alpha("public/assets/logo-full-white.png",240,100); b.paste(lg,(W-lg.width-64,H-bh+(bh-lg.height)//2),lg)
b.save("marketing/posts/post-b-manakish.png"); print("post-b")

# ================= POST C — brand story (green) =================
c=Image.new("RGB",(W,H),GREEN); d=ImageDraw.Draw(c)
lg=fit_alpha("public/assets/logo-full-white.png",240,100); c.paste(lg,((W-lg.width)//2,120),lg)
bowl=fit_alpha("public/assets/cat/nutrition-bowl.png",470,470); c.paste(bowl,((W-bowl.width)//2,360),bowl)
y=900
ctext(d,y,"from the soil",f(FB,96),CREAM); y+=104
ctext(d,y,"to the soul",f(FB,96),CREAM); y+=150
ctext(d,y,"unprocessed, gluten-free, seed-oil-free —",f(FR,34),CREAM); y+=48
ctext(d,y,"food that loves you back.",f(FR,34),CREAM); y+=120
ctext(d,y,"soft opening · sun 14 june · rawai",f(FB,40),CREAM)
c.save("marketing/posts/post-c-story.png"); print("post-c")
