"""Generate favicon + PWA icons from the Amani gold logo (A emblem only)."""
from PIL import Image
import numpy as np
import os

SRC = r'E:\Amani\frontend\public\logo.png'
OUT_DIR = r'E:\Amani\frontend\public\icons'
PUBLIC = r'E:\Amani\frontend\public'
os.makedirs(OUT_DIR, exist_ok=True)

img = Image.open(SRC).convert('RGBA')
arr = np.array(img)
r = arr[:, :, 0].astype(np.float32)
g = arr[:, :, 1].astype(np.float32)
b = arr[:, :, 2].astype(np.float32)
luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

rgba = arr.copy()
rgba[luma < 32, 3] = 0

# Bright gold pixels = emblem
core = (luma > 70) & (rgba[:, :, 3] > 50)
ys, xs = np.where(core)

# Keep upper emblem (A + circle), drop wordmark + dust outliers
y0 = int(np.percentile(ys, 0.5))
y1 = int(np.percentile(ys, 58))
x0 = int(np.percentile(xs, 12))
x1 = int(np.percentile(xs, 68))

cx = (x0 + x1) / 2
cy = (y0 + y1) / 2
side = max(x1 - x0, y1 - y0) * 1.22

left = int(cx - side / 2)
top = int(cy - side / 2)
right = int(cx + side / 2)
bottom = int(cy + side / 2)

h, w = rgba.shape[:2]
left, top = max(0, left), max(0, top)
right, bottom = min(w, right), min(h, bottom)

crop = Image.fromarray(rgba).crop((left, top, right, bottom))
cw, ch = crop.size
side_px = max(cw, ch)
square = Image.new('RGBA', (side_px, side_px), (0, 0, 0, 0))
square.paste(crop, ((side_px - cw) // 2, (side_px - ch) // 2), crop)

BRAND_BG = (30, 77, 61, 255)  # --amani-forest


def on_brand(size: int) -> Image.Image:
    # slight inset so A breathes inside the square
    inset = max(1, size // 14)
    inner = size - inset * 2
    scaled = square.resize((inner, inner), Image.Resampling.LANCZOS)
    bg = Image.new('RGBA', (size, size), BRAND_BG)
    bg.paste(scaled, (inset, inset), scaled)
    return bg


def on_transparent(size: int) -> Image.Image:
    return square.resize((size, size), Image.Resampling.LANCZOS)


ico_sizes = [16, 32, 48]
ico_images = [on_brand(s) for s in ico_sizes]
ico_path = os.path.join(PUBLIC, 'favicon.ico')
ico_images[-1].save(
    ico_path,
    format='ICO',
    sizes=[(s, s) for s in ico_sizes],
    append_images=ico_images[:-1],
)

assets = {
    os.path.join(PUBLIC, 'favicon.png'): on_brand(32),
    os.path.join(OUT_DIR, 'icon-192.png'): on_brand(192),
    os.path.join(OUT_DIR, 'icon-512.png'): on_brand(512),
    os.path.join(OUT_DIR, 'apple-touch-icon.png'): on_brand(180),
    os.path.join(OUT_DIR, 'icon-source.png'): on_transparent(512),
}

for path, im in assets.items():
    im.save(path, 'PNG', optimize=True)
    print('wrote', path, im.size)

print('wrote', ico_path)
