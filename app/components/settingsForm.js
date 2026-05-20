import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";

export function useSettingsForm(initialSettings, section) {
  const fetcher = useFetcher();
  const [settings, setSettings] = useState(initialSettings);
  const [device, setDevice] = useState("desktop");
  const [baseline, setBaseline] = useState(JSON.stringify(initialSettings));
  const dirty = useMemo(
    () => JSON.stringify(settings) !== baseline,
    [settings, baseline],
  );

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      setBaseline(JSON.stringify(settings));
      window.shopify?.toast?.show("Settings saved");
    }
  }, [fetcher.data, settings]);

  function update(path, value) {
    setSettings((current) => {
      const next = structuredClone(current);
      let pointer = next;
      for (let index = 0; index < path.length - 1; index += 1) {
        pointer = pointer[path[index]];
      }
      pointer[path[path.length - 1]] = value;
      return next;
    });
  }

  function save() {
    fetcher.submit(
      { settings: JSON.stringify(settings), section },
      { method: "POST" },
    );
  }

  function discard() {
    setSettings(JSON.parse(baseline));
  }

  return {
    settings,
    update,
    dirty,
    save,
    discard,
    device,
    setDevice,
    isSaving: fetcher.state !== "idle",
  };
}
