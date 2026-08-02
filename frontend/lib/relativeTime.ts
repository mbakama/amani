/** Affichage relatif : à l'instant / il y a X / hier à HHhmm / date complète */
export function formatRelativeWhen(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);

  const timeLabel = `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;

  const startOf = (date: Date) => {
    const x = new Date(date);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const today = startOf(now);
  const yesterday = today - 86_400_000;
  const day = startOf(d);

  if (diffMs < 0) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()} à ${timeLabel}`;
  }
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (day === today) {
    if (hours < 1) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (day === yesterday) return `hier à ${timeLabel}`;

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} à ${timeLabel}`;
}

export function formatActivityWhen(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const now = new Date();
  const startOf = (date: Date) => {
    const x = new Date(date);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const today = startOf(now);
  const yesterday = today - 86_400_000;
  const day = startOf(d);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  if (day === today) return `Aujourd'hui, ${time}`;
  if (day === yesterday) return `Hier, ${time}`;
  return formatRelativeWhen(value);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
