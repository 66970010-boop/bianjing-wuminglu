"""Rebuild browser assets. Requires Pillow.

Original PNGs/fonts remain available as source material.
"""
from pathlib import Path
import json
from PIL import Image, ImageFont, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
assets = ROOT / 'assets'
records = []
for source in sorted(assets.rglob('*.png')):
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image.save(target, 'WEBP', quality=88, method=6, exact=True)
        with Image.open(target) as result:
            assert result.size == image.size
            if 'A' in image.getbands():
                assert result.convert('RGBA').getchannel('A').tobytes() == image.getchannel('A').tobytes()
    records.append({'source': source.relative_to(ROOT).as_posix(), 'before': source.stat().st_size, 'after': target.stat().st_size})

# Render the three fixed labels; do not modify or redistribute a subset of
# the original font, whose license/source file remains unchanged.
font = ImageFont.truetype(str(assets / 'fonts/chongxi/chongxi_seal.otf'), 144)
for region, text in [('city', '城內'), ('river', '虹橋'), ('outskirts', '郊野')]:
    label = Image.new('RGBA', (168, 348))
    draw = ImageDraw.Draw(label)
    for index, glyph in enumerate(text):
        draw.text((84, 72 + index * 155.52), glyph, font=font, anchor='mm', fill='#fff4dc')
    label.save(assets / f'region-{region}.webp', 'WEBP', lossless=True, method=6)

# Home cover needs less resolution than the magnifiable full painting.
home_source = assets / 'home-hongqiao.webp'
home = assets / 'home-hongqiao-cover.webp'
before = home_source.stat().st_size
with Image.open(home_source) as source:
    image = source.copy()
image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
image.save(home, 'WEBP', quality=86, method=6)
records.append({'source': home.relative_to(ROOT).as_posix(), 'before': before, 'after': home.stat().st_size})

report = {'images': len(records), 'before': sum(r['before'] for r in records), 'after': sum(r['after'] for r in records), 'files': records}
(ROOT / 'verification/asset-optimization.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({k: v for k, v in report.items() if k != 'files'}))
