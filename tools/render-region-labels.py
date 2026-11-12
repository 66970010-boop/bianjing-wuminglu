"""Render fixed region inscriptions without changing the original font."""
from pathlib import Path
from PIL import Image, ImageFont, ImageDraw

assets = Path(__file__).resolve().parents[1] / 'assets'
font = ImageFont.truetype(str(assets / 'fonts/chongxi/chongxi_seal.otf'), 144)
for region, text in [('city', '城內'), ('river', '虹橋'), ('outskirts', '郊野')]:
    label = Image.new('RGBA', (168, 348))
    draw = ImageDraw.Draw(label)
    for index, glyph in enumerate(text):
        draw.text((84, 72 + index * 155.52), glyph, font=font, anchor='mm', fill='#fff4dc')
    label.save(assets / f'region-{region}.webp', 'WEBP', lossless=True, method=6)
