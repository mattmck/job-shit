export function logUsingEntries(entries: Array<{ label: string; value?: string }>): void {
  const filtered = entries.filter((entry): entry is { label: string; value: string } => Boolean(entry.value));
  if (filtered.length === 0) return;

  const width = Math.max(...filtered.map((entry) => entry.label.length));
  console.log('');
  for (const entry of filtered) {
    console.log(`Using ${entry.label.padEnd(width)} ${entry.value}`);
  }
}
