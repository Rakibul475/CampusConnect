import { useCallback, useEffect, useState } from "react";

// Runs an async loader, re-running when deps change or reload() is called.
// Keeps showing the previous data while a reload is in flight.
export function useAsync(loader, deps) {
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const key = JSON.stringify([...deps, version]);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: result.data, error: result.error, loading: result.key !== key, reload };
}
