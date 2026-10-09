#!/usr/bin/env python3
"""Build original, player-safe SVG battle maps for the 2014 Lost Mine adventure.

The printed maps are DM references. These SVGs are redrawn tactical boards, not
scans. They intentionally omit room keys, traps, secret doors, and creatures.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lmop-battle-maps"
OUT.mkdir(exist_ok=True)
W, H = 1500, 1000


CATALOG = [
    # id, chapter, title, coverage, 5-foot columns, fog, reveal
    ("triboar-trail", "Wilderness", "Triboar Trail · woodland", "Travel and daytime wilderness encounters", 30, False, "When a trail encounter begins"),
    ("night-camp", "Wilderness", "Wilderness night camp", "Nighttime wandering encounters", 30, False, "When a camp encounter begins"),
    ("conyberry-ruins", "Wilderness", "Conyberry ruins", "Ruined village approach", 30, False, "When the party enters Conyberry"),
    ("agatha-grove", "Wilderness", "Agatha's woodland grove", "Agatha's lair exterior and shelter", 30, False, "When the grove is reached; no banshee token until she appears"),
    ("old-owl-well", "Wilderness", "Old Owl Well", "Ruined tower, tent, and well", 30, False, "When the site is in view; place zombies only when they emerge"),
    ("wyvern-tor", "Wilderness", "Wyvern Tor ravine", "Orc camp, boulders, and cave", 30, False, "When the ravine camp is visible"),
    ("sleeping-giant", "Phandalin", "Sleeping Giant tap house", "Tap house interior and porch", 30, False, "When the party enters; place ruffians when seen"),
    ("tresendar-courtyard", "Phandalin", "Tresendar Manor courtyard", "Ruined manor approach", 30, False, "When the party reaches the ruins"),
    ("redbrand-crevasse", "Redbrand Hideout", "Redbrand Hideout · crevasse", "Area 8, two bridges and the fissure", 30, True, "Reveal after area 8 is entered; the nothic remains hidden until seen"),
    ("thundertree-overview", "Thundertree", "Thundertree · village", "Areas 1–13, exploration overview", 80, True, "Reveal only streets and ruins the party explores"),
    ("thundertree-brown-horse", "Thundertree", "Thundertree · Brown Horse", "Area 3 tavern and brewer's rooms", 30, True, "Reveal when the tavern is entered"),
    ("thundertree-spider-store", "Thundertree", "Thundertree · ruined store", "Area 6 webbed store and lane", 30, True, "Reveal visible webs; place spiders only when discovered"),
    ("thundertree-dragon-tower", "Thundertree", "Thundertree · dragon tower", "Area 7 tower, attached cottage, and hill", 30, True, "Reveal when the tower is approached; place Venomfang only when seen"),
    ("thundertree-garrison", "Thundertree", "Thundertree · old garrison", "Area 11 ruined barracks", 30, True, "Reveal when the garrison is entered"),
    ("thundertree-cultists", "Thundertree", "Thundertree · cultist cottage", "Area 13 cottage", 30, True, "Reveal when the cottage is entered"),
    ("cragmaw-castle", "Cragmaw Castle", "Cragmaw Castle · complete", "Areas 1–14, exploration and combat", 36, True, "Reveal rooms one at a time; the printed keyed map stays DM-side"),
    ("cragmaw-kings-quarters", "Cragmaw Castle", "Cragmaw Castle · king's quarters", "Area 14 close combat board", 30, True, "Reveal when the quarters are entered"),
    ("wave-south", "Wave Echo Cave", "Wave Echo Cave · southern workings", "Areas 1–8 and exits north", 44, True, "Reveal explored passages; hidden traps and creatures are omitted"),
    ("wave-central", "Wave Echo Cave", "Wave Echo Cave · central mine", "Areas 9–15 and connecting passages", 44, True, "Reveal explored areas one at a time"),
    ("wave-north", "Wave Echo Cave", "Wave Echo Cave · northern reaches", "Areas 16–20 and connecting passages", 44, True, "Reveal explored areas one at a time"),
    ("wave-great-cavern", "Wave Echo Cave", "Wave Echo Cave · great cavern", "Area 9 tiered cavern", 30, True, "Reveal when the great cavern is entered"),
    ("wave-smelter", "Wave Echo Cave", "Wave Echo Cave · smelter", "Area 12 furnace and dry waterwheel", 30, True, "Reveal the room first; place the flameskull and zombies when seen"),
    ("wave-forge", "Wave Echo Cave", "Wave Echo Cave · Forge of Spells", "Area 15 damaged workshop", 30, True, "Reveal when the forge is entered; place the spectator when seen"),
    ("wave-temple", "Wave Echo Cave", "Wave Echo Cave · Temple of Dumathoin", "Area 19 temple and Nezznar encounter", 30, True, "Reveal when the temple is entered; occupants depend on play"),
]


DEFS = """<defs>
<pattern id="grass" width="118" height="107" patternUnits="userSpaceOnUse"><rect width="118" height="107" fill="#68775d"/><path d="M8 24l7-8m5 10l6-6M63 20l5-9m4 11l8-9M95 73l9-8m-37 22l5-9M21 77l7-8m4 11l5-7" stroke="#829070" stroke-width="2" opacity=".65"/><circle cx="49" cy="54" r="3" fill="#536c4e"/><circle cx="108" cy="37" r="3" fill="#536c4e"/></pattern>
<pattern id="dirt" width="95" height="90" patternUnits="userSpaceOnUse"><rect width="95" height="90" fill="#95856a"/><path d="M9 14l17 3m35-9l13 6M24 66l12-6m33 16l13-4" stroke="#b3a182" stroke-width="3" opacity=".47"/><circle cx="48" cy="39" r="3" fill="#746a59"/></pattern>
<pattern id="stone" width="122" height="102" patternUnits="userSpaceOnUse"><rect width="122" height="102" fill="#a99b82"/><path d="M0 49h122M44 0v49m48 0v49M23 49v53m56-53v53" fill="none" stroke="#807966" stroke-width="2.4" opacity=".48"/><path d="M13 20l18-4m48 62l15 3" fill="none" stroke="#d1bea0" stroke-width="2" opacity=".45"/></pattern>
<pattern id="rock" width="110" height="96" patternUnits="userSpaceOnUse"><rect width="110" height="96" fill="#393b38"/><path d="M4 16l24-10 24 15 23-11 28 16M6 72l24 10 27-15 21 9 27-15" fill="none" stroke="#55594f" stroke-width="3" opacity=".65"/></pattern>
<pattern id="wood" width="48" height="100" patternUnits="userSpaceOnUse"><rect width="48" height="100" fill="#83694c"/><path d="M0 0v100M23 0v100M47 0v100" stroke="#57432f" stroke-width="4"/><path d="M7 23v44m33-59v54" stroke="#a5845b" stroke-width="2" opacity=".6"/></pattern>
<pattern id="water" width="110" height="80" patternUnits="userSpaceOnUse"><rect width="110" height="80" fill="#3e6570"/><path d="M5 16q23-10 46 0t53 0M9 55q23-10 46 0t50 0" fill="none" stroke="#95b3ad" stroke-width="3" opacity=".52"/></pattern>
<pattern id="web" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M0 0l70 70M70 0L0 70M35 0v70M0 35h70" stroke="#d6d1bc" stroke-width="2" opacity=".5" fill="none"/></pattern>
<radialGradient id="canopy"><stop stop-color="#8a9a73"/><stop offset=".62" stop-color="#526a4e"/><stop offset="1" stop-color="#344e3c"/></radialGradient>
<radialGradient id="fire"><stop stop-color="#ffda83"/><stop offset=".4" stop-color="#d78637"/><stop offset="1" stop-color="#70432c"/></radialGradient>
</defs>"""


class Board:
    def __init__(self, slug: str, title: str, outdoor: bool = False):
        self.slug, self.title = slug, title
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{escape(title)} player-safe battle map">', DEFS]
        self.parts.append(f'<rect width="{W}" height="{H}" fill="url(#{"grass" if outdoor else "rock"})"/>')
        self.rng = random.Random(slug)
        if outdoor:
            for _ in range(140):
                x, y = self.rng.randrange(20, W-20), self.rng.randrange(20, H-20)
                self.parts.append(f'<path d="M{x} {y}l4-8m-2 8l9-5" stroke="#879378" stroke-width="2" opacity=".36"/>')

    def add(self, fragment: str): self.parts.append(fragment)
    def rect(self, x, y, w, h, fill='url(#stone)', stroke='#393b34', sw=9, rx=0):
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
    def path(self, d, fill='none', stroke='none', sw=0, extra=''):
        self.add(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" {extra}/>')
    def circle(self, x, y, r, fill, stroke='#334632', sw=4):
        self.add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
    def ellipse(self, x, y, rx, ry, fill, stroke='#334632', sw=4):
        self.add(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
    def line(self, x1,y1,x2,y2,stroke='#433f36',sw=8,extra=''):
        self.add(f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" {extra}/>')
    def tree(self,x,y,r=51):
        self.circle(x+5,y+7,r+5,'#273f36','#263d35',3)
        for dx,dy,scale in [(-.32,-.18,.58),(.27,-.2,.62),(0,.28,.68)]:
            self.circle(round(x+dx*r),round(y+dy*r),round(r*scale),'url(#canopy)','#334d3b',3)
        self.circle(x,y,max(5,r//9),'#53432f','#3a3328',2)
    def bush(self,x,y,r=29):
        self.ellipse(x,y,r,r*.66,'#526746','#354635',4)
        self.ellipse(x-r*.28,y-r*.18,r*.48,r*.28,'#81906b','#4e6045',2)
    def boulder(self,x,y,r=28):
        self.path(f'M{x-r} {y-r//3}l{r//2}-{r//2} {r} 0 {r//2} {r//2}-{r//4} {r}h-{r}z','#77796e','#4d514c',5)
        self.line(x-r//3,y-r//3,x+r//3,y-r//2,'#a2a397',3)
    def rubble(self,x,y,n=11,spread=75):
        for _ in range(n):
            bx=x+self.rng.randrange(-spread,spread);by=y+self.rng.randrange(-spread,spread)
            self.boulder(bx,by,self.rng.randrange(6,18))
    def trail(self,d,width=170):
        self.path(d,'none','#52614e',width+18)
        self.path(d,'none','url(#dirt)',width)
        self.path(d,'none','#c1ad86',3,extra='opacity=".36"')
    def cavern(self,d): self.path(d,'url(#dirt)','#242927',17)
    def corridor(self,d,width=70):
        self.path(d,'none','#242927',width+18)
        self.path(d,'none','url(#stone)',width)
    def room(self,x,y,w,h,ruin=False):
        self.rect(x,y,w,h,'url(#stone)','#30332f',14)
        if ruin:
            for px,py in [(x+25,y+27),(x+w-36,y+24),(x+w-35,y+h-31)]:self.rubble(px,py,4,22)
    def doorway(self,x,y,vertical=False,width=62):
        if vertical:
            self.rect(x-12,y-width/2,24,width,'url(#stone)','none',0)
            self.line(x-15,y-width/2,x-15,y+width/2,'#5e523e',4)
        else:
            self.rect(x-width/2,y-12,width,24,'url(#stone)','none',0)
            self.line(x-width/2,y-15,x+width/2,y-15,'#5e523e',4)
    def table(self,x,y,w=110,h=50,angle=0):
        self.add(f'<g transform="rotate({angle} {x} {y})"><rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="8" fill="url(#wood)" stroke="#443729" stroke-width="7"/><circle cx="{x-w/2+13}" cy="{y-h/2+12}" r="4" fill="#3c3125"/><circle cx="{x+w/2-13}" cy="{y+h/2-12}" r="4" fill="#3c3125"/></g>')
    def barrel(self,x,y,r=21):
        self.circle(x,y,r,'#7b6246','#40372d',5)
        self.circle(x,y,r*.62,'none','#b69a6e',3)
    def bed(self,x,y,w=92,h=42):
        self.rect(x,y,w,h,'#6b5945','#3e372e',5,4)
        self.rect(x+6,y+5,22,h-10,'#c5b495','#6d6555',2,3)
    def fire(self,x,y,r=29):
        self.circle(x,y,r+12,'#49453d','#353d39',4)
        self.circle(x,y,r,'url(#fire)','#ac6736',3)
        self.path(f'M{x-12} {y+6}q6-25 13-13 6-23 18 11-6 14-18 14z','#ffd37e','#a8562e',2)
    def pool(self,d): self.path(d,'url(#water)','#2b4b54',8)
    def stairs(self,x,y,w=100,h=70,vertical=False):
        self.rect(x,y,w,h,'#8d816e','#504d43',5)
        count=6
        for j in range(1,count):
            if vertical:self.line(x+j*w/count,y+5,x+j*w/count,y+h-5,'#5c5a50',4)
            else:self.line(x+5,y+j*h/count,x+w-5,y+j*h/count,'#5c5a50',4)
    def write(self):
        self.add(f'<rect x="7" y="7" width="{W-14}" height="{H-14}" fill="none" stroke="#232a27" stroke-width="14"/>')
        self.add('</svg>')
        (OUT / f'{self.slug}.svg').write_text('\n'.join(self.parts)+'\n')


def scattered(board, trees=8, rocks=9, bushes=10, exclusions=()):
    def free(x,y): return all((x-ex)**2+(y-ey)**2>radius**2 for ex,ey,radius in exclusions)
    for n,fn in ((trees,board.tree),(rocks,board.boulder),(bushes,board.bush)):
        for _ in range(n):
            for _ in range(80):
                x,y=board.rng.randrange(80,W-80),board.rng.randrange(80,H-80)
                if free(x,y):break
            fn(x,y)


def finish(board): board.write()


def triboar_trail():
    b=Board('triboar-trail','Triboar Trail woodland battlefield',True)
    b.trail('M-30 570Q290 435 560 520T1120 450Q1350 430 1530 330',190)
    scattered(b,19,16,24,[(740,500,260),(340,520,200),(1180,410,180)])
    for x,y in [(245,403),(546,721),(1082,664)]:b.boulder(x,y,41)
    b.path('M95 829l181-43 31 19-173 60z','#5d4c37','#3a392f',6)
    finish(b)


def night_camp():
    b=Board('night-camp','Wilderness night camp battlefield',True)
    b.rect(0,0,W,H,'#172b31','none',0)
    for _ in range(125):
        x,y=b.rng.randrange(20,W),b.rng.randrange(20,H)
        b.circle(x,y,b.rng.randrange(1,4),'#8b9a89','none',0)
    b.ellipse(750,510,430,310,'#3f503f','#52614b',6)
    b.trail('M-40 700Q450 510 650 555T1535 280',100)
    scattered(b,20,12,12,[(750,510,360)])
    b.fire(750,510,38)
    for x,y,a in [(590,400,0),(1000,580,90)]:
        b.add(f'<g transform="rotate({a} {x} {y})"><path d="M{x-105} {y+55}L{x} {y-72} {x+105} {y+55}z" fill="#8b7657" stroke="#443f35" stroke-width="8"/><path d="M{x} {y-72}v127" stroke="#c7b58e" stroke-width="4"/></g>')
    b.barrel(853,450,20);b.table(703,688,92,38)
    finish(b)


def conyberry():
    b=Board('conyberry-ruins','Conyberry ruined village battlefield',True)
    b.trail('M-40 660Q440 610 770 520T1540 470',155)
    for x,y,w,h in [(150,180,240,175),(530,105,210,210),(990,130,260,165),(140,730,280,185),(590,650,255,200),(1120,645,235,220)]:
        b.room(x,y,w,h,True)
        b.rect(x+25,y+25,w-50,h-50,'#5c684f','none',0)
        b.rubble(x+w/2,y+h/2,13,min(w,h)//3)
    scattered(b,12,16,24,[(750,560,280)])
    finish(b)


def agatha():
    b=Board('agatha-grove',"Agatha's woodland grove battlefield",True)
    b.ellipse(765,520,435,345,'#738069','#4c644d',12)
    b.trail('M-40 920Q380 690 565 630T910 540',85)
    for x,y,r in [(90,120,92),(260,170,86),(450,100,79),(760,90,94),(1020,100,85),(1310,90,85),(1430,340,80),(1370,700,95),(1210,930,82),(100,850,88),(210,470,83)]:b.tree(x,y,r)
    b.ellipse(845,460,175,132,'#665b47','#3b4439',11)
    b.path('M675 465Q725 286 845 288 973 301 1018 459M684 495Q744 325 845 317 952 335 1002 489','none','#695641',23)
    for x,y in [(680,428),(752,332),(840,307),(943,337),(1014,445)]:b.bush(x,y,26)
    b.path('M765 520q80-80 160-10','none','#b5a989',5,extra='opacity=".6"')
    finish(b)


def old_owl_well():
    b=Board('old-owl-well','Old Owl Well battlefield',True)
    b.trail('M-50 800Q270 625 455 590T840 430Q1200 260 1540 190',135)
    b.path('M245 260l560-66 73 505-573 65z','url(#dirt)','#514e43',13)
    b.path('M320 315l400-45 52 335-410 51z','url(#stone)','#49483e',19)
    b.rubble(485,370,14,90);b.rubble(706,566,19,75)
    b.circle(590,535,62,'#6f716a','#3b413d',16)
    b.circle(590,535,39,'url(#water)','#363f42',5)
    b.path('M1065 415l180 60-86 170-204-70z','#ab8054','#4c4239',11)
    b.line(1065,415,1159,645,'#dec394',4);b.line(1245,475,955,575,'#dec394',4)
    b.fire(1020,680,27)
    scattered(b,5,18,14,[(620,500,360),(1100,510,240)])
    finish(b)


def wyvern_tor():
    b=Board('wyvern-tor','Wyvern Tor ravine and cave battlefield',True)
    b.path('M20 85Q300 160 400 350T390 980L0 1000z','#686a60','#3c443e',14)
    b.path('M1490 60Q1120 240 1170 480T1500 950z','#63695e','#3c443e',14)
    b.path('M375 60Q650 215 785 150 950 115 1170 285L1160 840Q950 710 790 882 500 850 390 1000z','url(#dirt)','#52594d',16)
    b.trail('M600 1000Q650 800 655 650T880 360',100)
    for x,y,r in [(375,360,55),(514,190,42),(1080,625,48),(1190,240,68),(600,850,48),(915,785,48),(777,440,35)]:b.boulder(x,y,r)
    b.ellipse(915,255,181,89,'#212827','#4e5148',17)
    b.path('M775 259q130-86 270 0','none','#a69c83',7)
    b.fire(850,500,34)
    for x,y in [(570,520),(1040,550),(885,660),(700,305)]:b.bed(x,y,84,42)
    scattered(b,4,20,6,[(800,520,310)])
    finish(b)


def sleeping_giant():
    b=Board('sleeping-giant','Sleeping Giant tap house battlefield')
    b.rect(0,0,W,H,'url(#dirt)','none',0)
    b.room(160,115,1120,720)
    b.rect(160,765,1120,80,'url(#wood)','#403b30',9)
    b.line(860,115,860,835,'#363a35',18)
    b.doorway(860,470,True,92);b.doorway(430,835,False,108)
    b.rect(990,170,230,410,'url(#wood)','#423729',8)
    b.rect(1035,186,145,65,'#6d5138','#3b3128',5)
    for x,y in [(365,295),(610,305),(360,560),(615,580)]:
        b.table(x,y,150,84)
        for dx,dy in [(-96,0),(96,0)]:b.rect(x+dx-16,y-26,32,52,'#5d4a36','#3d342a',3)
    b.fire(1110,705,59);b.barrel(950,675,25);b.barrel(1240,660,25)
    for x,y in [(215,185),(1215,160),(216,708)]:b.barrel(x,y,20)
    finish(b)


def tresendar():
    b=Board('tresendar-courtyard','Tresendar Manor ruined courtyard battlefield',True)
    b.trail('M-30 835Q380 610 595 570T1500 385',145)
    b.path('M440 120h620v520H440z','url(#stone)','#343b34',20)
    b.rect(475,165,260,245,'#57654f','#404b3e',12)
    b.rect(795,165,230,245,'#57654f','#404b3e',12)
    b.path('M450 465h580','none','#555345',16)
    b.rubble(555,287,24,100);b.rubble(975,510,21,90)
    b.stairs(670,500,180,100)
    for x,y,r in [(190,190,67),(1230,125,64),(1350,770,80),(245,760,74)]:b.tree(x,y,r)
    scattered(b,3,15,14,[(770,400,450)])
    finish(b)


def redbrand_crevasse():
    b=Board('redbrand-crevasse','Redbrand Hideout crevasse battlefield')
    b.cavern('M95 110Q315 70 455 143 630 105 792 153 1010 72 1375 154L1440 890Q1134 930 915 855 736 958 530 876 288 942 100 843z')
    b.path('M690 136Q606 294 695 410 611 585 695 735 618 843 706 902L835 908Q912 806 817 700 906 565 828 420 906 274 808 148z','#20262a','#3f413d',10)
    b.path('M565 345h385M554 680h398','none','#4d3727',62)
    b.path('M565 345h385M554 680h398','none','url(#wood)',42)
    b.stairs(105,440,150,110)
    for x,y in [(260,280),(1115,235),(1190,685),(310,795)]:b.boulder(x,y,40)
    b.rubble(960,760,19,100)
    finish(b)


def thundertree_overview():
    b=Board('thundertree-overview','Thundertree player-safe village overview',True)
    b.trail('M-25 470Q310 420 590 590T1530 495',105)
    b.trail('M660 1030Q540 770 720 600T835 25',85)
    b.trail('M1140 1030Q1045 685 1140 510T1280 30',75)
    # Building positions follow the relative arrangement of the published village.
    ruins=[(70,320,190,150),(300,420,130,150),(440,410,155,145),
           (335,105,190,125),(300,725,145,130),(510,750,125,120),
           (650,735,155,120),(765,725,125,120),(1065,110,195,135),
           (1040,465,125,145),(1240,430,110,135),(1260,735,155,130)]
    for x,y,w,h in ruins:
        b.room(x,y,w,h,True)
        b.rect(x+18,y+18,w-36,h-36,'#536847','none',0)
        b.rubble(x+w/2,y+h/2,5,30)
    # Druid's Watch remains intact at the southwest edge.
    b.room(300,625,115,88)
    # Dragon's tower and cottage are distinct and elevated.
    b.ellipse(800,170,245,150,'#717769','#485e4b',9)
    b.circle(835,170,79,'url(#stone)','#383d37',16)
    b.rect(600,115,155,115,'url(#stone)','#383d37',14)
    b.doorway(756,170,True,38)
    # The town square's visible statue.
    b.circle(1120,390,31,'#c1b494','#5d5f52',7)
    b.line(1120,365,1120,410,'#777766',9)
    # Webs are apparent from the lane; spiders are not drawn.
    b.rect(610,565,145,105,'url(#web)','none',0)
    for x,y,r in [(140,90,60),(570,315,49),(815,420,63),(965,480,55),(1455,220,55),(50,850,65),(1020,875,58),(1170,275,49),(520,535,48)]:b.tree(x,y,r)
    for x,y in [(670,425),(750,555),(995,640),(360,580),(1280,660)]:b.bush(x,y,41)
    finish(b)


def thundertree_brown_horse():
    b=Board('thundertree-brown-horse','Thundertree Brown Horse tavern battlefield',True)
    b.trail('M-20 850Q600 835 1520 720',120)
    b.room(180,150,1090,610,True)
    b.line(760,150,760,760,'#3b3d35',17)
    b.doorway(760,470,True,85);b.doorway(390,760,False,100)
    for x,y in [(300,240),(430,275),(300,430),(465,530)]:b.barrel(x,y,52)
    b.rect(875,230,230,140,'url(#wood)','#473a2e',8)
    for x,y in [(860,570),(1080,545),(1165,400)]:b.barrel(x,y,29)
    b.fire(1210,690,30)
    b.rubble(1170,195,18,65)
    scattered(b,3,8,7,[(730,470,570)])
    finish(b)


def thundertree_spider_store():
    b=Board('thundertree-spider-store','Thundertree ruined store battlefield',True)
    b.trail('M-30 810Q470 670 1530 600',130)
    b.room(360,205,760,495,True)
    b.rect(400,250,690,410,'url(#web)','none',0)
    for x,y in [(440,300),(900,335),(510,595),(960,585)]:b.rect(x,y,80,48,'#75634f','#463e32',6)
    b.path('M515 705Q675 485 820 680M675 705Q855 420 1120 650','none','#d5d2bb',12,extra='opacity=".72"')
    b.path('M515 705Q675 485 820 680M675 705Q855 420 1120 650','none','#f0e9d0',4,extra='opacity=".65"')
    for x,y,r in [(180,210,72),(1280,250,80),(1320,755,72),(170,650,60)]:b.tree(x,y,r)
    scattered(b,3,9,13,[(770,470,520)])
    finish(b)


def thundertree_dragon_tower():
    b=Board('thundertree-dragon-tower','Thundertree dragon tower battlefield',True)
    b.ellipse(800,470,620,410,'#79806d','#4a5546',15)
    b.trail('M-20 925Q270 650 470 650T690 550',105)
    b.circle(945,440,282,'url(#stone)','#363a35',23)
    b.circle(945,440,229,'#73725f','#55594f',7)
    b.rect(275,250,410,390,'url(#stone)','#343b35',19)
    b.doorway(685,450,True,88)
    b.doorway(715,640,False,78)
    b.rubble(1010,300,18,92)
    b.rubble(1120,565,12,85)
    for x,y in [(452,355),(454,540)]:b.table(x,y,116,70)
    for x,y,r in [(180,170,70),(1310,135,68),(1370,800,65),(370,850,65)]:b.tree(x,y,r)
    for x,y in [(640,700),(1200,735)]:b.boulder(x,y,43)
    finish(b)


def thundertree_garrison():
    b=Board('thundertree-garrison','Thundertree old garrison battlefield',True)
    b.room(190,135,1120,690,True)
    b.rect(240,170,330,570,'#7e816f','#4a4d44',6)
    b.line(620,135,620,825,'#383b35',18)
    b.doorway(620,495,True,82);b.doorway(430,825,False,105)
    for x,y in [(705,215),(1020,220),(705,485),(1020,500)]:b.bed(x,y,215,68)
    b.stairs(255,660,125,110)
    b.fire(1125,690,35)
    b.rubble(360,325,21,95);b.rubble(1220,170,14,55)
    finish(b)


def thundertree_cultists():
    b=Board('thundertree-cultists','Thundertree dragon cultists cottage battlefield',True)
    b.trail('M-30 875Q610 720 1520 790',105)
    b.room(235,165,1050,620)
    b.line(760,165,760,785,'#393d37',15)
    b.doorway(760,440,True,80);b.doorway(520,785,False,105)
    b.table(495,420,265,125)
    for x,y in [(352,230),(1080,245),(1000,610)]:b.bed(x,y,142,57)
    for x,y in [(300,700),(1200,665)]:b.barrel(x,y,22)
    b.fire(1000,400,43)
    scattered(b,6,9,8,[(750,460,550)])
    finish(b)


def cragmaw_castle():
    b=Board('cragmaw-castle','Cragmaw Castle player-safe battlefield',True)
    b.rect(0,0,W,H,'#596447','none',0)
    for x,y,r in [(63,100,72),(1320,880,85),(1435,130,70),(75,900,68)]:b.tree(x,y,r)
    b.trail('M-25 505Q130 485 245 510',115)
    # Broad connected floor first; individual thick walls are drawn over it.
    for d,w in [('M245 495H640V390H1110',88),('M640 390V670H1160',86),('M630 590H1160',85),('M815 250V620',86),('M770 680V900',85)]:b.corridor(d,w)
    # The round towers intentionally have irregular broken outer edges.
    for x,y,r in [(285,265,155),(280,732,150),(807,220,144),(1240,246,175),(1240,745,160)]:
        b.circle(x,y,r,'url(#stone)','#303630',18)
    b.room(138,405,222,193)   # 1 entrance terrace
    b.room(375,390,220,223)   # 2 hall
    b.room(132,225,120,118)   # north archer post
    b.room(133,650,120,119)   # south archer post
    b.room(362,138,161,161)   # 5 store
    b.room(255,137,133,190)   # 6 barracks
    b.room(603,470,407,302)   # 7 banquet
    b.room(638,311,302,171)   # 8 dark hall
    b.room(697,143,221,172)   # 9 shrine
    b.room(970,323,193,163,True) # 11 ruins
    b.room(1082,476,183,150)  # 12 guards
    b.room(1090,672,263,191,True) # 13 owlbear
    b.room(1060,144,300,212)  # 14 king
    # Doors on explored routes; no secret doors, tripwire, room keys, or enemies.
    for x,y,v,w in [(365,500,True,71),(595,500,True,64),(730,470,False,72),
                    (934,398,True,66),(1010,583,True,68),(1080,548,True,61),
                    (1190,670,False,71),(1110,356,False,76),(690,312,False,62),
                    (580,305,True,60),(255,277,True,54),(255,714,True,54)]:b.doorway(x,y,v,w)
    b.stairs(100,458,99,105,True)
    b.stairs(712,875,150,86)
    b.rubble(460,480,17,58);b.rubble(1130,385,21,62);b.rubble(1210,720,21,91)
    b.fire(836,560,33);b.fire(1220,265,34)
    b.table(790,635,235,62)
    b.table(1190,222,122,52)
    for x,y in [(310,170),(325,254),(1085,510),(1100,575)]:b.bed(x,y,82,42)
    for x,y in [(420,200),(495,250),(1055,355),(1145,775)]:b.barrel(x,y,22)
    finish(b)


def cragmaw_kings_quarters():
    b=Board('cragmaw-kings-quarters',"Cragmaw Castle king's quarters battlefield")
    b.circle(755,515,405,'url(#stone)','#30352f',24)
    b.rect(365,435,115,140,'url(#stone)','#30352f',12)
    b.doorway(470,500,True,115)
    b.ellipse(770,555,225,147,'#916c52','#5a4538',7)
    b.table(580,305,178,80)
    b.bed(935,405,190,90)
    b.fire(1070,640,41)
    for x,y in [(505,710),(895,740),(1190,470)]:b.barrel(x,y,24)
    b.rect(600,735,170,65,'url(#wood)','#41372d',6)
    b.rubble(390,260,14,71)
    finish(b)


def wave_south():
    b=Board('wave-south','Wave Echo Cave southern workings battlefield')
    # A connected, player-safe combat layout for printed areas 1–8.
    for d,w in [('M340 760H735V760H1230',82),('M665 810V420H445V260',70),
                ('M885 720V370H1155V275',68),('M665 390H950',76),('M735 730V1010',70)]:b.corridor(d,w)
    b.cavern('M80 595Q225 490 430 565L550 750Q470 929 285 940 80 898 70 722z')  # 1
    b.cavern('M220 120Q460 75 540 250L475 470 245 490 115 315z') # 2
    b.cavern('M570 540Q785 515 915 637L949 848 624 889 533 725z') # 3
    b.room(825,820,222,135) # 4
    b.room(1105,775,210,171) # 5
    b.room(790,225,272,195) # 6
    b.room(1125,205,237,203,True) # 7
    b.cavern('M1040 430Q1330 335 1430 488L1450 720Q1320 785 1083 675z') # 8
    b.doorway(924,820,False,60);b.doorway(1110,840,True,60)
    b.doorway(942,420,False,68);b.doorway(1126,320,True,64)
    b.circle(340,730,59,'#4d4740','#2e3432',11)  # area 1 pit
    for x,y,r in [(220,660,37),(430,660,31),(310,875,29),(715,655,31),(825,765,28)]:b.boulder(x,y,r)
    for x,y in [(850,260),(870,340)]:b.bed(x,y,102,39)
    b.table(1190,840,115,49)
    for x,y in [(1165,270),(1290,277),(1230,347)]:b.barrel(x,y,21)
    for x,y,r in [(1165,480,40),(1300,590,36),(1140,680,29)]:
        b.circle(x,y,r,'#839166','#414f43',6)
        b.circle(x-9,y-8,r*.22,'#c9d793','none',0)
    b.rubble(470,330,11,46)
    finish(b)


def wave_central():
    b=Board('wave-central','Wave Echo Cave central mine battlefield')
    for d,w in [('M-30 685H425V590H770',75),('M650 335V630H1180',74),
                ('M930 580H1270V800',65),('M405 520V260H140',72),('M750 975V630',72)]:b.corridor(d,w)
    b.cavern('M335 440Q540 370 790 426L865 680Q740 842 480 795 295 766 295 580z') # 9
    b.pool('M70 450Q190 395 290 510L322 730Q225 861 75 768z') # 10
    b.room(85,147,332,206) # 11
    b.cavern('M500 105Q770 65 925 147L978 338Q812 436 524 365z') # 12
    b.cavern('M930 400Q1265 318 1435 456L1450 725Q1290 803 955 690z') # 13
    b.room(1010,765,192,180) # 14
    b.room(1260,765,192,180) # 15
    b.doorway(1150,765,False,65);b.doorway(1350,765,False,65)
    b.doorway(410,240,True,68)
    for x,y in [(360,260),(225,265)]:b.bed(x,y,105,38)
    b.fire(700,255,58)
    b.circle(782,190,82,'#665848','#3f453e',9) # furnace base
    b.circle(1255,845,47,'#65a279','#315c4e',8) # green forge
    for x,y in [(525,585),(695,640),(560,725)]:b.table(x,y,120,52)
    for x,y,r in [(1030,505,25),(1325,580,36),(1030,647,34)]:b.boulder(x,y,r)
    for x,y in [(1130,825),(1340,900)]:b.table(x,y,80,39)
    b.rubble(990,865,14,62)
    finish(b)


def wave_north():
    b=Board('wave-north','Wave Echo Cave northern reaches battlefield')
    for d,w in [('M180 800H580V620H960V640H1200',75),('M560 615V330H850',70),
                ('M960 640V360H1220',68),('M460 620V1000',68)]:b.corridor(d,w)
    b.room(90,160,385,310) # 19 temple
    b.room(510,165,230,190) # 20 priests
    b.cavern('M400 435Q665 359 815 478L820 729Q650 817 430 730z') # 18 collapsed
    b.cavern('M770 115Q970 74 1030 235L965 390 775 355z') # 17 streambed
    b.cavern('M1020 245Q1280 118 1450 260L1460 810Q1220 854 1010 697z') # 16 booming
    b.pool('M1120 290Q1355 155 1435 320L1440 768Q1220 807 1125 665z')
    b.doorway(455,312,True,70);b.doorway(510,260,True,60)
    b.rect(270,208,125,150,'#7f755f','#494a40',8)
    b.circle(290,260,35,'#94907a','#4d534b',5) # dwarf statue base
    for x,y in [(160,220),(420,230),(160,415),(420,415)]:b.circle(x,y,19,'#c7b99a','#55584e',5)
    b.fire(315,390,21)
    b.bed(565,210,108,39)
    b.path('M640 470Q580 575 650 726','none','#242629',78)
    b.path('M640 470Q580 575 650 726','none','#5c6460',5)
    b.stairs(525,558,78,94)
    for x,y,r in [(495,525,21),(720,585,30),(770,690,25),(875,235,22)]:b.boulder(x,y,r)
    finish(b)


def wave_great_cavern():
    b=Board('wave-great-cavern','Wave Echo Cave great cavern battlefield')
    b.cavern('M95 100Q385 50 650 145 1000 60 1370 172L1450 690Q1240 925 955 876 555 950 250 851 60 670 95 100z')
    b.path('M120 430Q300 350 445 452T800 430Q1040 380 1395 458','none','#4b514a',44)
    b.path('M130 490Q395 530 570 485T920 504Q1200 500 1400 542','none','#c0ae8b',8)
    b.stairs(542,412,95,90)
    b.stairs(995,462,100,100)
    for x,y in [(350,250),(850,265),(1100,310),(340,680),(800,715),(1160,685)]:b.table(x,y,130,55)
    for x,y in [(425,540),(1030,660)]:b.fire(x,y,28)
    for x,y,r in [(200,215,35),(1310,200,45),(710,810,36),(1140,835,30)]:b.boulder(x,y,r)
    finish(b)


def wave_smelter():
    b=Board('wave-smelter','Wave Echo Cave smelter battlefield')
    b.cavern('M85 108Q415 42 745 120 1110 62 1410 170L1455 790Q1180 930 780 879 420 950 100 811z')
    b.rect(518,222,425,332,'#676459','#333c38',13)
    b.circle(734,385,115,'#65473a','#373d38',16)
    b.circle(734,385,68,'url(#fire)','#433a34',10)
    b.path('M948 417h330v107H948z','url(#dirt)','#373d39',12)
    b.circle(1200,560,137,'#786e57','#383d38',16)
    for a in range(0,360,45):
        theta=math.radians(a);b.line(1200,560,1200+math.cos(theta)*110,560+math.sin(theta)*110,'#51493c',11)
    b.circle(1200,560,28,'#433d35','#c0a57a',7)
    b.path('M990 820Q1180 780 1480 876','none','#3c5260',58)
    b.path('M990 820Q1180 780 1480 876','none','#8497a0',6)
    for x,y in [(240,270),(335,330),(320,690)]:b.rect(x,y,155,95,'url(#wood)','#433c32',9)
    for x,y,r in [(165,510,35),(990,200,39),(920,720,27)]:b.boulder(x,y,r)
    finish(b)


def wave_forge():
    b=Board('wave-forge','Forge of Spells battlefield')
    b.room(90,100,1320,805)
    b.circle(810,474,120,'#756f5d','#3a433d',16)
    b.circle(810,474,69,'#6daa7b','#2c5a48',11)
    b.circle(810,474,34,'#9fd89a','#447956',3)
    for x,y,a in [(320,260,12),(1195,260,-15),(340,720,-8),(1195,720,12)]:
        b.table(x,y,213,96,a)
        b.barrel(x+100,y+15,17)
    b.stairs(140,450,130,98,True)
    b.rubble(1230,480,24,113)
    b.rubble(220,170,13,58)
    finish(b)


def wave_temple():
    b=Board('wave-temple','Temple of Dumathoin battlefield')
    b.room(90,85,1320,830)
    b.rect(585,145,320,218,'#827b67','#444b43',12)
    b.circle(745,260,83,'#a69b80','#51594f',7)
    b.path('M745 188v138m-65-68h130','none','#5e6457',13)
    for x,y in [(280,260),(460,260),(1030,260),(1210,260),
                (280,540),(460,540),(1030,540),(1210,540),
                (280,790),(460,790),(1030,790),(1210,790)]:
        b.circle(x,y,31,'#c4b598','#50574e',9)
    b.fire(800,660,30)
    b.table(1000,670,175,70)
    for x,y in [(455,720),(560,740),(1110,735)]:b.bed(x,y,100,42)
    b.doorway(750,915,False,130)
    b.rubble(195,125,14,68)
    finish(b)


BUILDERS = {
    'triboar-trail': triboar_trail,
    'night-camp': night_camp,
    'conyberry-ruins': conyberry,
    'agatha-grove': agatha,
    'old-owl-well': old_owl_well,
    'wyvern-tor': wyvern_tor,
    'sleeping-giant': sleeping_giant,
    'tresendar-courtyard': tresendar,
    'redbrand-crevasse': redbrand_crevasse,
    'thundertree-overview': thundertree_overview,
    'thundertree-brown-horse': thundertree_brown_horse,
    'thundertree-spider-store': thundertree_spider_store,
    'thundertree-dragon-tower': thundertree_dragon_tower,
    'thundertree-garrison': thundertree_garrison,
    'thundertree-cultists': thundertree_cultists,
    'cragmaw-castle': cragmaw_castle,
    'cragmaw-kings-quarters': cragmaw_kings_quarters,
    'wave-south': wave_south,
    'wave-central': wave_central,
    'wave-north': wave_north,
    'wave-great-cavern': wave_great_cavern,
    'wave-smelter': wave_smelter,
    'wave-forge': wave_forge,
    'wave-temple': wave_temple,
}


def build_catalog():
    existing = [
        dict(id='phandalin-street', chapter='Phandalin', title='Phandalin street',
             image='lmop-battle-maps/professional/phandalin-street.png',
             coverage='Redbrand street confrontation and other town fights',
             gridColumns=30, fog=False, reveal='When a street encounter begins'),
        dict(id='redbrand-hideout', chapter='Redbrand Hideout', title='Redbrand Hideout',
             image='lmop-battle-maps/professional/redbrand-hideout.png',
             coverage='Areas 1–12 exploration with fog',
             gridColumns=30, fog=True, reveal='Reveal explored rooms and passages'),
    ]
    new_items = [dict(id=f'lmop-map-{slug}', chapter=chapter, title=title,
                      image=f'lmop-battle-maps/professional/{slug}.png', coverage=coverage,
                      gridColumns=columns, fog=fog, reveal=reveal)
                 for slug, chapter, title, coverage, columns, fog, reveal in CATALOG]
    items = existing + new_items
    js = "(() => {\n  'use strict';\n  globalThis.LMOP_BATTLE_MAP_CATALOG = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n})();\n"
    (ROOT / 'LMOP-Battle-Map-Catalog.js').write_text(js)
    guide = [
        '# Lost Mine of Phandelver · battlefield map guide', '',
        f'{len(new_items)} new player-safe, professionally rendered tactical maps, plus upgraded Phandalin street and Redbrand Hideout maps. The original SVG layouts remain available.', '',
        'See the [professional contact sheet](lmop-battle-maps/Professional-Map-Contact-Sheet.png) for a quick preview of every new map.', '',
        'The [prompt set](lmop-battle-maps/Professional-Map-Prompts.md) records how the realistic editions were made.', '',
        'These are **top-down battle boards**, with a 3:2 shape matched to the app stage. The app draws its five-foot grid and tokens over each image. The printed adventure map remains the DM reference for exact navigation and room dimensions; the larger exploration and sector boards are staging layouts rather than exact copies of the printed floor plans. No room keys, enemies, secret doors, or concealed traps are drawn on the player maps. The original SVG layouts remain in the parent map folder as simpler geometry references.', '',
        'Open the app’s **Battle maps** tab to filter by chapter and preview privately. Press **Show battlefield** when ready. Fogged sites begin covered; reveal explored space and place creatures only when the party sees them. Grid columns below count five-foot squares across the board.', '',
        'The 2014 adventure reference is [Lost Mine of Phandelver](../../sources/pdfcoffee.com_lost-mine-of-phandelverpdf-pdf-free.pdf); Thundertree, castle, and mine layouts are on printed pp. 31, 37, and 43.', '',
        '## Existing maps', '',
        '| Location | File | Use |', '|---|---|---|',
        '| Phandalin street | [Professional map](lmop-battle-maps/professional/phandalin-street.png) · [Original SVG](session-02-visuals/phandalin-street.svg) | Redbrand street confrontation and other town street fights |',
        '| Redbrand Hideout | [Professional map](lmop-battle-maps/professional/redbrand-hideout.png) · [Original SVG](session-02-visuals/redbrand-hideout.svg) | Areas 1–12 exploration with fog |', '',
    ]
    last = None
    for item in new_items:
        if item['chapter'] != last:
            last = item['chapter']
            guide += [f'## {last}', '', '| Map | Covers | Show when | Grid | File |', '|---|---|---|---:|---|']
        guide.append(f"| {item['title']} | {item['coverage']} | {item['reveal']} | {item['gridColumns']} | [PNG]({item['image']}) |")
    guide += ['', '## Using the sector maps', '',
              'Wave Echo Cave is split into southern workings (areas 1–8), central mine (9–15), and northern reaches (16–20) so tokens remain usable on a TV. Switch sectors at the connecting passages, carrying each character’s position forward by judgment. Use the four room-scale boards when a major battle needs more space.', '',
              'The Cragmaw Castle and Thundertree overviews support exploration with fog. Switch to a room board where one is supplied, and return to the overview afterward. The app stores fog separately for each map.', '']
    (ROOT / 'LMOP-Battle-Map-Guide.md').write_text('\n'.join(guide))


if __name__ == '__main__':
    assert len(BUILDERS) == len(CATALOG) == 24
    for slug, *_ in CATALOG:
        BUILDERS[slug]()
    build_catalog()
    print(f'Built {len(CATALOG)} battle maps in {OUT}')
