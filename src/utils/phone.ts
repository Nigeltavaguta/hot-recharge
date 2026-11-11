import type { Network } from '@/models';

export const NETWORKS: { id: Network; name: string }[] = [
  { id: 'econet', name: 'Econet' },
  { id: 'netone', name: 'NetOne' },
  { id: 'telecel', name: 'Telecel' },
];

const PREFIXES: Record<string, Network> = {
  '077': 'econet',
  '078': 'econet',
  '071': 'netone',
  '073': 'telecel',
};

/** Turns "+263 77 234 5678", "263772345678" or "772345678" into "0772345678". */
export function normalizeMobile(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('263')) digits = digits.slice(3);
  if (digits.length > 0 && !digits.startsWith('0')) digits = `0${digits}`;
  return digits;
}

export function isValidMobile(input: string): boolean {
  return /^07[1378]\d{7}$/.test(normalizeMobile(input));
}

/** Works out the network from the number prefix so the user does not have to pick it. */
export function detectNetwork(input: string): Network | null {
  return PREFIXES[normalizeMobile(input).slice(0, 3)] ?? null;
}

export function networkName(network: Network): string {
  return NETWORKS.find((n) => n.id === network)?.name ?? network;
}

export const METER_LENGTH = 11;
