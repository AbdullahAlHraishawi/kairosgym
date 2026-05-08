// Lightweight pub/sub so components using useProfile refresh when a profile
// mutation happens elsewhere in the app (e.g. character picker on Profile tab
// while the Home tab panel stays mounted in TabsShell).
type Listener = () => void;

const listeners = new Set<Listener>();

export function emitProfileChanged() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // ignore listener errors
    }
  });
}

export function onProfileChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
