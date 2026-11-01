const listeners = new Set<() => void>();

export function onSessionLost(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionLost(): void {
  for (const listener of listeners) listener();
}
