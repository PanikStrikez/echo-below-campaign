"""Build original, player-safe bird's-eye maps for campaign exploration."""
from pathlib import Path
from random import Random
from html import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'town-maps'
OUT.mkdir(exist_ok=True)

HEAD = '''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="{title} bird's-eye exploration map">
<defs>
  <linearGradient id="ground" x2="0" y2="1"><stop stop-color="{ground1}"/><stop offset="1" stop-color="{ground2}"/></linearGradient>
  <linearGradient id="roof" x2="0" y2="1"><stop stop-color="#ac7050"/><stop offset=".5" stop-color="#80513b"/><stop offset="1" stop-color="#5c3a30"/></linearGradient>
  <linearGradient id="stone" x2="0" y2="1"><stop stop-color="#cbbda0"/><stop offset="1" stop-color="#8c8069"/></linearGradient>
  <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="8" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".08"/></feComponentTransfer></filter>
  <filter id="shadow"><feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#2b2418" flood-opacity=".33"/></filter>
  <clipPath id="mapclip"><rect x="25" y="85" width="1150" height="650" rx="9"/></clipPath>
</defs>
<rect width="1200" height="800" fill="#211f1a"/>
<rect x="8" y="8" width="1184" height="784" rx="15" fill="#d5c39b" stroke="#705639" stroke-width="8"/>
<rect x="17" y="17" width="1166" height="766" rx="9" fill="none" stroke="#a48452" stroke-width="2"/>
<rect x="25" y="85" width="1150" height="650" rx="9" fill="url(#ground)"/>
<g clip-path="url(#mapclip)">
'''
FOOT = '''</g>
<rect x="25" y="85" width="1150" height="650" rx="9" fill="none" stroke="#5a5038" stroke-width="4"/>
<rect x="27" y="87" width="1146" height="646" rx="8" fill="none" stroke="#e4cf97" stroke-width="2"/>
<rect x="34" y="24" width="1132" height="48" rx="5" fill="#263127" stroke="#a98953" stroke-width="2"/>
<text x="600" y="58" text-anchor="middle" fill="#f3dcaa" font-size="32" letter-spacing="5" font-family="Georgia,serif">{title}</text>
<g transform="translate(1044 641)" fill="none" stroke="#253e36" stroke-width="2">
  <circle r="47" fill="#dfcfaa" fill-opacity=".83"/><path d="M0-38V38M-38 0H38M-27-27 27 27M27-27-27 27"/>
  <path d="M0-40 9 0 0 40-9 0Z" fill="#8b4d38"/><path d="M-40 0 0-9 40 0 0 9Z" fill="#e7d2a0"/>
  <text x="0" y="-51" text-anchor="middle" fill="#263e36" stroke="none" font-size="18" font-family="Georgia,serif">N</text>
</g>
<text x="43" y="767" fill="#57452f" font-size="16" font-family="Georgia,serif">SCHEMATIC CAMPAIGN MAP · EXPLORE THE MARKERS</text>
<rect x="25" y="85" width="1150" height="650" fill="#fff4d7" filter="url(#paper)" opacity=".7" pointer-events="none"/>
</svg>'''


def path(d, fill, opacity=1, stroke='none', width=0):
    return f'<path d="{d}" fill="{fill}" opacity="{opacity}" stroke="{stroke}" stroke-width="{width}"/>'


def road(d, width=34):
    return (f'<path d="{d}" fill="none" stroke="#705f44" stroke-width="{width+10}" opacity=".47" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="#d8c798" stroke-width="{width}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="#f0dfa9" stroke-width="{width-10}" opacity=".55" stroke-linecap="round"/>')


def tree(x, y, r, autumn=False):
    color = '#687b52' if not autumn else '#8a7344'
    dark = '#3d5541' if not autumn else '#61583b'
    return (f'<g filter="url(#shadow)"><circle cx="{x+3}" cy="{y+4}" r="{r}" fill="{dark}"/>'
            f'<circle cx="{x-3}" cy="{y-4}" r="{r*.83:.1f}" fill="{color}"/>'
            f'<circle cx="{x-8}" cy="{y-10}" r="{r*.34:.1f}" fill="#9bad74" opacity=".5"/></g>')


def roof(x, y, w, h, rot=0, ruin=False, stone=False):
    main = 'url(#stone)' if stone else 'url(#roof)'
    wall = '#766d5c' if stone or ruin else '#d5bd8e'
    return (f'<g transform="translate({x} {y}) rotate({rot})" filter="url(#shadow)">'
            f'<rect x="{-w/2:.1f}" y="{-h/2:.1f}" width="{w}" height="{h}" rx="2" fill="{wall}" stroke="#5b5140" stroke-width="2"/>'
            f'<path d="M{-w/2-4:.1f},{-h/2:.1f} L0,{-h/2-8:.1f} L{w/2+4:.1f},{-h/2:.1f} L{w/2+4:.1f},{h/2:.1f} L0,{h/2+8:.1f} L{-w/2-4:.1f},{h/2:.1f}Z" fill="{main}" stroke="#5c4b3b" stroke-width="2"/>'
            f'<path d="M0,{-h/2-8:.1f}V{h/2+8:.1f}" stroke="#d1a477" stroke-width="2" opacity=".75"/>'
            + (f'<path d="M{-w/2-3:.1f},{-h/2:.1f} l{w*.35:.1f},{h*.55:.1f} m{w*.2:.1f},-8 l{w*.2:.1f},-{h*.45:.1f}" stroke="#4e4b42" stroke-width="5"/>' if ruin else '')
            + '</g>')


def scatter_trees(rng, zones, count, autumn=False):
    parts = []
    for _ in range(count):
        x1, y1, x2, y2 = zones[rng.randrange(len(zones))]
        parts.append(tree(rng.randrange(x1, x2), rng.randrange(y1, y2), rng.randrange(8, 17), autumn))
    return ''.join(parts)


def phandalin():
    r = Random(19)
    parts = [path('M20 550 Q220 570 350 735H15Z', '#a7a874', .48),
             path('M54 130 Q230 90 408 220T630 145L650 83H25Z', '#8eaa74', .32),
             path('M886 550 Q1110 470 1190 630V745H826Z', '#b2a77c', .58),
             path('M950 240 Q1060 164 1180 230V470Q1090 485 972 424Z', '#9d936f', .55),
             '<ellipse cx="595" cy="418" rx="130" ry="80" fill="#adc18a" stroke="#8a9d6e" stroke-width="3"/>',
             scatter_trees(r, [(80,130,425,350),(70,450,365,710),(820,125,1170,305),(830,535,1170,718)], 86),
             road('M-20 472 C230 454 380 434 595 415 C785 396 935 383 1220 375', 40),
             road('M695 75 C685 230 658 350 595 415 C520 520 385 637 305 755', 35),
             road('M595 415 C600 530 635 650 650 760', 29),
             road('M570 408 C405 360 285 292 85 254', 24),
             road('M860 394 C910 510 950 600 1030 740', 23),
             path('M945 292 Q1050 245 1148 284L1158 441Q1080 421 988 433Z', '#8b8b6a', .48, '#625e48', 3)]
    for x,y,w,h,rot in [(750,270,72,48,-12),(676,358,78,53,7),(621,492,68,46,-9),(430,534,67,46,-18),
                        (537,636,68,44,5),(529,313,37,50,0),(838,352,75,49,18),(921,579,66,41,9),
                        (279,283,72,44,-22),(1055,352,103,74,10)]:
        parts.append(roof(x,y,w,h,rot,stone=(x==1055)))
    for _ in range(47):
        x = r.randrange(332,875); y = r.randrange(225,678)
        if 495 < x < 705 and 350 < y < 490: continue
        if any(abs(x-a)<55 and abs(y-b)<42 for a,b in [(750,270),(676,358),(621,492),(430,534),(537,636),(838,352)]): continue
        parts.append(roof(x,y,r.randrange(20,36),r.randrange(15,26),r.randrange(-25,26)))
    parts += ['<circle cx="581" cy="404" r="15" fill="#d5c8a3" stroke="#705e45" stroke-width="3"/>',
              '<circle cx="581" cy="404" r="6" fill="#6a8d93"/>',
              '<text x="78" y="238" fill="#524b32" font-size="19" font-family="Georgia,serif">WESTERN FIELDS</text>',
              '<text x="698" y="122" fill="#524b32" font-size="17" font-family="Georgia,serif">TRIBOAR TRAIL ↑</text>']
    return ''.join(parts)


def conyberry():
    r=Random(34)
    parts=[path('M0 120 Q300 96 515 204Q842 103 1200 177V85H0Z','#6e8966',.6),
           path('M12 570Q295 490 495 640T1180 600V739H20Z','#a6a578',.56),
           path('M775 86Q748 239 883 378T1140 742', 'none', 1, '#678d91', 42),
           path('M775 86Q748 239 883 378T1140 742', 'none', 1, '#8fb9b4', 29),
           scatter_trees(r,[(50,105,360,345),(870,105,1160,290),(68,520,450,714),(940,500,1150,710)],115,True),
           road('M-20 475 Q245 448 495 431 T1210 458',40),
           road('M500 85 Q560 252 565 429 Q545 570 450 747',25),
           road('M370 448 Q340 550 285 695',18),
           '<ellipse cx="600" cy="422" rx="115" ry="61" fill="#a5aa77" stroke="#7b815b" stroke-width="3"/>']
    for x,y,w,h,rot in [(460,295,66,44,-8),(800,285,77,50,14),(595,410,58,39,0),(350,575,53,40,-12),
                        (745,565,57,42,8),(980,447,59,38,0)]:
        parts.append(roof(x,y,w,h,rot,ruin=True,stone=True))
    for _ in range(29):
        x=r.randrange(250,925);y=r.randrange(215,610)
        if 495<x<700 and 350<y<485:continue
        parts.append(roof(x,y,r.randrange(19,32),r.randrange(15,25),r.randrange(-20,20),True,True))
    parts += ['<path d="M764 400 Q805 390 845 405" fill="none" stroke="#5d503b" stroke-width="12"/>',
              '<text x="66" y="668" fill="#4c5338" font-size="18" font-family="Georgia,serif">OLD FOREST</text>',
              '<text x="614" y="365" fill="#564c38" font-size="18" font-family="Georgia,serif">RUINED GREEN</text>']
    return ''.join(parts)


def thundertree():
    r=Random(57)
    parts=[path('M28 94Q275 125 442 92T840 128Q1030 116 1180 95V737H25Z','#71816b',.3),
           path('M244 96Q338 350 210 738','none',1,'#6a8f97',27),
           path('M244 96Q338 350 210 738','none',1,'#a1c3c0',18),
           scatter_trees(r,[(44,100,425,710),(400,100,820,410),(650,350,1160,720),(925,105,1160,420)],160,True),
           road('M-15 505 Q320 475 570 448 Q820 418 1220 408',29),
           road('M455 82 Q488 310 568 445 Q595 585 570 760',23),
           road('M566 445 Q780 300 915 124',17),
           road('M765 410 Q850 560 950 735',17),
           '<ellipse cx="872" cy="392" rx="78" ry="58" fill="#b2af83" stroke="#686b4d" stroke-width="3"/>']
    for x,y,w,h,rot in [(235,384,65,44,8),(415,377,76,52,-7),(438,226,81,55,-8),(358,588,60,43,5),
                        (695,575,76,52,11),(760,218,108,99,0),(872,563,69,52,4),(915,349,62,46,-6),
                        (1005,414,78,58,0),(1068,222,79,58,-5),(1060,590,74,54,7)]:
        parts.append(roof(x,y,w,h,rot,ruin=(x!=760),stone=True))
    for _ in range(20):
        x=r.randrange(300,1060);y=r.randrange(190,650)
        parts.append(roof(x,y,r.randrange(16,29),r.randrange(13,22),r.randrange(-20,20),True,True))
    parts += ['<circle cx="870" cy="392" r="13" fill="#b4b3a0" stroke="#5e5d4b" stroke-width="3"/>',
              '<text x="56" y="670" fill="#3e4f3e" font-size="18" font-family="Georgia,serif">OVERGROWN WEST</text>']
    return ''.join(parts)


def waterdeep():
    r=Random(92)
    parts=[path('M26 86H345Q310 246 335 389Q293 590 407 735H25Z','#477f94'),
           path('M26 86H345Q310 246 335 389Q293 590 407 735H25Z','none',1,'#b4d0c2',8),
           path('M330 100Q318 246 350 390Q309 599 415 716','none',1,'#74634b',17),
           path('M330 100Q318 246 350 390Q309 599 415 716','none',1,'#d3bd89',9),
           path('M360 160 Q420 94 705 107 L1000 139 Q1115 289 1090 575 L1000 716 L420 712 Q350 590 371 405Z','#b9ab7c',.75,'#665844',9),
           path('M390 206Q622 177 1010 191M411 372Q723 356 1077 363M408 555Q730 565 1050 548','none',1,'#806d4c',47),
           path('M390 206Q622 177 1010 191M411 372Q723 356 1077 363M408 555Q730 565 1050 548','none',1,'#e4cf97',30),
           road('M565 95Q566 354 567 735',25),road('M760 101Q775 388 740 735',27),
           road('M935 128Q902 358 933 712',23),
           path('M808 248Q950 225 1040 283L1035 406Q929 430 814 389Z','#708c68',.7,'#59654e',5),
           scatter_trees(r,[(810,255,1040,399),(360,108,1135,175),(375,635,1010,710)],88)]
    for _ in range(300):
        x=r.randrange(412,1038);y=r.randrange(150,688)
        if 805<x<1040 and 240<y<410:continue
        if abs(y-360)<34 or abs(y-555)<32 or abs(y-205)<28:continue
        if abs(x-565)<28 or abs(x-760)<30 or abs(x-930)<26:continue
        parts.append(roof(x,y,r.randrange(13,24),r.randrange(11,20),r.randrange(-8,9)))
    for x,y,w,h in [(598,398,70,55),(450,448,95,72),(902,313,73,57),(670,252,67,54),
                    (844,505,72,52),(698,605,69,55)]:
        parts.append(roof(x,y,w,h,stone=True))
    for x in [140,205,270,340]:
        parts.append(path(f'M{x} 560v102m0-99 107 6','none',1,'#75624a',9))
    parts += ['<text x="468" y="180" fill="#514735" font-size="18" font-family="Georgia,serif">SEA WARD</text>',
              '<text x="782" y="177" fill="#514735" font-size="18" font-family="Georgia,serif">NORTH WARD</text>',
              '<text x="589" y="318" fill="#514735" font-size="18" font-family="Georgia,serif">CASTLE WARD</text>',
              '<text x="823" y="460" fill="#514735" font-size="18" font-family="Georgia,serif">TRADES WARD</text>',
              '<text x="509" y="640" fill="#514735" font-size="18" font-family="Georgia,serif">DOCK WARD</text>',
              '<text x="826" y="641" fill="#514735" font-size="18" font-family="Georgia,serif">SOUTHERN WARD</text>',
              '<text x="85" y="390" fill="#e9efe3" font-size="32" font-style="italic" font-family="Georgia,serif">Sea of Swords</text>']
    return ''.join(parts)


MAPS = [
    ('phandalin-overhead.svg', 'PHANDALIN', '#b7b98d', '#a5a67a', phandalin),
    ('conyberry-overhead.svg', 'CONYBERRY', '#aaa982', '#919a75', conyberry),
    ('thundertree-overhead.svg', 'THUNDERTREE', '#9da784', '#7d8d71', thundertree),
    ('waterdeep-overhead.svg', 'WATERDEEP', '#c2b184', '#b19c73', waterdeep),
]
for filename, title, ground1, ground2, builder in MAPS:
    svg = HEAD.format(title=escape(title), ground1=ground1, ground2=ground2) + builder() + FOOT.format(title=escape(title))
    (OUT / filename).write_text(svg, encoding='utf-8')
    print(filename)
