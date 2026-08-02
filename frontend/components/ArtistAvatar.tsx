// Avatar par initiales ou photo — palette alignee Amani (foret / bronze)
const RAMPS = [
  { bg: '#E4EBE6', text: '#1E4D3D' },
  { bg: '#F0E8DE', text: '#8A6540' },
  { bg: '#DDE8E2', text: '#14201C' },
  { bg: '#E8EFEA', text: '#2F6B54' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function rampFor(name: string) {
  const index = (name.charCodeAt(0) || 0) % RAMPS.length;
  return RAMPS[index];
}

export default function ArtistAvatar({
  name,
  size = 40,
  src,
}: {
  name: string;
  size?: number;
  src?: string | null;
}) {
  const ramp = rampFor(name);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="flex-shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, background: ramp.bg, color: ramp.text }}
      className="flex flex-shrink-0 items-center justify-center rounded-full font-medium"
    >
      <span style={{ fontSize: size * 0.32 }}>{initials(name)}</span>
    </div>
  );
}
