from PIL import Image
import numpy as np
import os

src = r'E:\Amani\frontend\public\logo.png'
img = Image.open(src).convert('RGBA')
arr = np.array(img)
r, g, b = arr[:, :, 0].astype(np.float32), arr[:, :, 1].astype(np.float32), arr[:, :, 2].astype(np.float32)
luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

# Stronger keying: near-black becomes transparent
mask = luma < 36
arr[mask, 3] = 0
soft = (luma >= 36) & (luma < 58)
factor = ((luma[soft] - 36) / 22).clip(0, 1)
arr[soft, 3] = (arr[soft, 3].astype(np.float32) * factor).astype(np.uint8)

alpha = arr[:, :, 3]

# Focus crop on the bright gold core (ignore sparse dust speckles)
core = alpha > 40
ys, xs = np.where(core)
# Prefer denser central mass: use percentiles to ignore outliers
y0, y1 = int(np.percentile(ys, 2)), int(np.percentile(ys, 98))
x0, x1 = int(np.percentile(xs, 3)), int(np.percentile(xs, 97))
pad_x, pad_y = 18, 14
h, w = arr.shape[:2]
left = max(0, x0 - pad_x)
right = min(w, x1 + pad_x)
top = max(0, y0 - pad_y)
bottom = min(h, y1 + pad_y)

out = Image.fromarray(arr).crop((left, top, right, bottom))

# Nav-friendly size
tw = 520
ratio = tw / out.size[0]
out = out.resize((tw, max(1, int(out.size[1] * ratio))), Image.Resampling.LANCZOS)

out_path = r'E:\Amani\frontend\public\logo-nav.png'
out.save(out_path, 'PNG', optimize=True)
print('saved', out_path, out.size, os.path.getsize(out_path))
