import { useEffect, useState } from 'react';
import type { Network, Product } from '@/models';
import { api, errorMessage } from '@/services';

export function useProducts(category: Product['category'], network?: Network | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, select] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    // Clear product selections from the previous resource before the asynchronous query returns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null); setProducts([]); select(null);
    api.getProducts().then(all => {
      if (!active) return;
      const list = all.filter(p => p.category === category && (!network || p.network === network));
      setProducts(list); select(list[0]?.id ?? null);
    }).catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category, network, attempt]);
  return { products, selected: products.find(p => p.id === selectedId) ?? null, select, loading, error, retry: () => setAttempt(a => a + 1) };
}
