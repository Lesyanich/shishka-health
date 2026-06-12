from PIL import Image, ImageDraw, ImageFont, ImageOps

W,H=1080,1350
GREEN=(58,74,28); RED=(182,42,35); CREAM=(245,238,223); CREAM50=(251,248,240); INK=(27,30,20)
FB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FR="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
def f(p,s): return ImageFont.truetype(p,s)

def circle(path,size,border=8,bcol=(255,255,255)):
    im=Image.open(path).convert("RGBA")
    bg=Image.new("RGBA",im.size,(255,255,255,255)); bg.alpha_composite(im); im=bg.convert("RGB")
    im=ImageOps.fit(im,(size,size),Image.LANCZOS)
    mask=Image.new("L",(size,size),0); ImageDraw.Draw(mask).ellipse([0,0,size,size],fill=255)
    out=Image.new("RGBA",(size+2*border,size+2*border),(0,0,0,0))
    ImageDraw.Draw(out).ellipse([0,0,size+2*border,size+2*border],fill=bcol)
    out.paste(im,(border,border),mask)
    return out

def ctext(d,y,t,font,fill,W=W,ls=0):
    if ls:
        widths=[d.textlength(c,font=font)+ls for c in t]; total=sum(widths)-ls; x=(W-total)/2
        for c in t: d.text((x,y),c,font=font,fill=fill); x+=d.textlength(c,font=font)+ls
    else:
        w=d.textlength(t,font=font); d.text(((W-w)/2,y),t,font=font,fill=fill)

# ---------- POST B : MANAKISH on cream ----------
b=Image.new("RGB",(W,H),CREAM50); d=ImageDraw.Draw(b)
y=120
ctext(d,y,"MADE DAILY",f(FR,30),GREEN,ls=10); y+=80
ctext(d,y,"MANAKISH,",f(FB,112),GREEN); y+=116
ctext(d,y,"DONE RIGHT",f(FB,112),GREEN); y+=140
ctext(d,y,"Sourdough base · clean ingredients · zero seed oils",f(FR,32),(90,94,80)); y+=120
imgs=["menu/manakish-zaatar.png","menu/manakish-cheese-olive.png","menu/manakish-beef.png"]
labels=["Za'atar","Cheese & Olive","Beef"]
size=270; gap=60; total=3*size+2*gap; x0=(W-total)//2
for i,(p,lab) in enumerate(zip(imgs,labels)):
    c=circle("public/assets/"+p,size)
    cx=x0+i*(size+gap)-8
    b.paste(c,(cx,y),c)
    lf=f(FB,30); lw=d.textlength(lab,font=lf); d.text((x0+i*(size+gap)+(size-lw)/2,y+size+24),lab,font=lf,fill=GREEN)
# bottom green bar
bh=150; d.rectangle([0,H-bh,W,H],fill=GREEN)
d.text((64,H-bh+52),"Grand opening · Sun 14 June",font=f(FB,40),fill=CREAM)
logo=Image.open("public/assets/logo-full-white.png").convert("RGBA")
lw=240; lh=int(logo.height*lw/logo.width); logo=logo.resize((lw,lh),Image.LANCZOS)
b.paste(logo,(W-lw-64,H-bh+(bh-lh)//2),logo)
b.save("marketing/posts/post-b-manakish.png","PNG"); print("saved post-b")

# ---------- POST C : BRAND STORY on green ----------
c=Image.new("RGB",(W,H),GREEN); d=ImageDraw.Draw(c)
logo2=Image.open("public/assets/logo-full-white.png").convert("RGBA")
lw=240; lh=int(logo2.height*lw/logo2.width); logo2=logo2.resize((lw,lh),Image.LANCZOS)
c.paste(logo2,((W-lw)//2,110),logo2)
bowl=circle("public/assets/cat/nutrition-bowl.png",500,border=10,bcol=(255,255,255,36))
c.paste(bowl,((W-520)//2,360),bowl)
y=940
ctext(d,y,"FROM THE SOIL",f(FB,92),CREAM); y+=104
ctext(d,y,"TO THE SOUL",f(FB,92),CREAM); y+=150
ctext(d,y,"Unprocessed, gluten-free, seed-oil-free —",f(FR,34),CREAM); y+=48
ctext(d,y,"food that loves you back.",f(FR,34),CREAM); y+=110
ctext(d,y,"Grand opening · Sun 14 June · Rawai",f(FB,40),CREAM)
c.save("marketing/posts/post-c-story.png","PNG"); print("saved post-c")
