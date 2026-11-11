import { ActivityIndicator, View } from 'react-native';
import type { Product } from '@/models';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';

export function ProductPicker({ products, selected, select, loading, error, retry }: {
  products: Product[]; selected: Product | null; select: (id: string) => void; loading: boolean; error: string | null; retry: () => void;
}) {
  return <View style={{ gap: 8 }}>
    {loading && <ActivityIndicator />}
    {error && <><Notice tone="danger" text={error} /><Button label="Retry products" variant="outline" onPress={retry} /></>}
    {!loading && !error && products.length === 0 && <Notice tone="info" text="No supported products are available." />}
    {products.map(p => <Button key={p.id} label={`${p.name} (${p.currency})${selected?.id === p.id ? ' ✓' : ''}`} variant="outline" onPress={() => select(p.id)} />)}
  </View>;
}
