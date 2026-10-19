"""Genera le icone PWA: cronometro stilizzato bianco su verde bottiglia, arco arancio.

Solo geometria, nessun font. Rilanciabile:  python tools/make-icons.py
Le icone finiscono in icons/. Richiede Pillow.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "icons"

GREEN = (46, 75, 60, 255)
ORANGE = (184, 92, 0, 255)
WHITE = (255, 255, 255, 255)


def render(size: int, *, safe_ratio: float, rounded: bool) -> Image.Image:
    scale = 4  # disegno in grande e riduco: bordi morbidi
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.18), fill=GREEN)
    else:
        d.rectangle([0, 0, s - 1, s - 1], fill=GREEN)

    c = s * safe_ratio
    cx, cy = s / 2, s / 2 + c * 0.06
    r = c * 0.36
    w = max(2, int(c * 0.075))
    # quadrante
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=WHITE, width=w)
    # arco arancio del tempo trascorso
    d.arc([cx - r, cy - r, cx + r, cy + r], start=-90, end=30, fill=ORANGE, width=w)
    # pulsante in alto
    bw, bh = c * 0.16, c * 0.08
    d.rectangle([cx - bw / 2, cy - r - bh - w * 0.6, cx + bw / 2, cy - r - w * 0.6], fill=WHITE)
    # lancetta
    d.line([cx, cy, cx, cy - r * 0.62], fill=WHITE, width=w)
    d.ellipse([cx - w, cy - w, cx + w, cy + w], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    ICONS.mkdir(exist_ok=True)
    render(192, safe_ratio=0.86, rounded=True).save(ICONS / "icon-192.png")
    render(512, safe_ratio=0.86, rounded=True).save(ICONS / "icon-512.png")
    render(512, safe_ratio=0.62, rounded=False).save(ICONS / "icon-maskable-512.png")
    render(180, safe_ratio=0.8, rounded=False).save(ICONS / "apple-touch-icon.png")
    render(32, safe_ratio=0.95, rounded=True).save(ICONS / "favicon-32.png")
    render(16, safe_ratio=0.95, rounded=True).save(ICONS / "favicon-16.png")
    print("icone generate in", ICONS)


if __name__ == "__main__":
    main()
