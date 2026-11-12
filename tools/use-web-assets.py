"""Switch runtime references to the optimized assets (also handles dynamic URLs)."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
files = [p for p in root.iterdir() if p.suffix in {'.html', '.css', '.js'}]
files += [p for p in (root / 'assets').rglob('*') if p.suffix in {'.css', '.js'} and 'vendor' not in p.parts]
for path in files:
    original = path.read_text(encoding='utf-8')
    updated = original.replace('.png', '.webp')
    updated = updated.replace('assets/home-hongqiao.webp', 'assets/home-hongqiao-cover.webp')
    if path.name == 'index.html':
        updated = re.sub(r'''((?:src|href)=["'])([^"']+\.(?:css|js))(?:\?[^"']*)?(["'])''', r'\1\2?v=webp-20261112\3', updated)
    if path.name == 'ui-overrides.css':
        updated = re.sub(r"@font-face\{font-family:'Region (?:Inscription|Small Seal)';[^}]*\}\n?", '', updated)
    if updated != original:
        path.write_text(updated, encoding='utf-8')

