from PIL import Image, ImageDraw, ImageFont, ImageOps

W,H = 1080,1350
GREEN=(58,74,28); GREEN9=(33,44,14); RED=(182,42,35); CREAM=(245,238,223)
FB="/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FR="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
def f(p,s): return ImageFont.truetype(p,s)

# --- background photo, cover-crop to 1080x1350 ---
bg = Image.open("public/assets/hero-saladbar.jpg").convert("RGB")
bg = ImageOps.fit(bg,(W,H),Image.LANCZOS)
img = bg.copy()

# --- vertical green wash ---
wash = Image.new("RGBA",(W,H))
wd = ImageDraw.Draw(wash)
for y in range(H):
    t=y/H
    a=int(150*(1-t)+225*t) if t>0.4 else int(150-60*(t/0.4))
    wd.line([(0,y),(W,y)],fill=(GREEN9[0],GREEN9[1],GREEN9[2],max(70,min(230,a))))
img = Image.alpha_composite(img.convert("RGBA"),wash).convert("RGB")
d = ImageDraw.Draw(img)

def center(y,text,font,fill=CREAM,ls=0):
    if ls:
        # letter spacing
        widths=[d.textlength(c,font=font)+ls for c in text]; total=sum(widths)-ls
        x=(W-total)/2
        for c in text:
            d.text((x,y),c,font=font,fill=fill); x+=d.textlength(c,font=font)+ls
    else:
        w=d.textlength(text,font=font); d.text(((W-w)/2,y),text,font=font,fill=fill)

# logo (white, transparent) centered top
logo=Image.open("public/assets/logo-full-white.png").convert("RGBA")
lw=420; lh=int(logo.height*lw/logo.width); logo=logo.resize((lw,lh),Image.LANCZOS)
img.paste(logo,((W-lw)//2,96),logo)

y=96+lh+44
center(y,"SEED OIL & GLUTEN FREE",f(FR,30),CREAM,ls=10); y+=70
center(y,"GRAND",f(FB,150),CREAM); y+=150
center(y,"OPENING",f(FB,150),CREAM); y+=168
center(y,"Rawai · Phuket",f(FR,40),CREAM)

# lower block
yb=900
d.line([(W/2-60,yb),(W/2+60,yb)],fill=CREAM,width=4); yb+=46
center(yb,"SUN 14 JUNE · 9AM–6PM",f(FB,52),CREAM); yb+=80
center(yb,"\U0001F4CD Soi Naya 2 — next to TOPS Daily",f(FR,34),CREAM); yb+=92
# red pill
pill="20% OFF · FIRST 50 GUESTS"
pf=f(FB,44); pw=d.textlength(pill,font=pf); px=(W-pw)/2-46; py=yb
d.rounded_rectangle([px,py,px+pw+92,py+98],radius=49,fill=RED)
d.text(((W-pw)/2,py+24),pill,font=pf,fill=(255,255,255))

center(H-100,"F R O M   T H E   S O I L   T O   T H E   S O U L",f(FR,26),CREAM)

out="marketing/posts/post-a-announcement.png"
img.save(out,"PNG"); print("saved",out)
