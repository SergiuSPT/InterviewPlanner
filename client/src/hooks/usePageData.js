import { useEffect, useState } from "react";

// Call with a stable loader (declared outside the component).
export default function usePageData(loader, id) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await loader(id);
        if (active) setResult({ id, data, error: "" });
      } catch (error) {
        if (active) setResult({ id, data: null, error: error.response?.data?.message || "Could not load this page. Please try again." });
      }
    }
    load();
    return () => { active = false; };
  }, [loader, id]);

  if (!result || result.id !== id) return { data: null, error: "", isLoading: true };
  return { ...result, isLoading: false };
}
