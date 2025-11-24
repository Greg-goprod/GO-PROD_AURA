/**
 * Couleurs AURA pour le système Kanban
 */
export type AuraColor = 'taupe' | 'cobalt' | 'resolution' | 'eminence' | 'purpureus' | 'lightgreen';

export const AURA_KANBAN_COLORS: Record<AuraColor, { hex: string; bg: string; border: string; text: string; badgeBg: string }> = {
  taupe: {
    hex: '#919399',
    bg: '#91939915',
    border: '#919399',
    text: 'text-white',
    badgeBg: 'bg-white/20',
  },
  cobalt: {
    hex: '#1246A3',
    bg: '#1246A315',
    border: '#1246A3',
    text: 'text-white',
    badgeBg: 'bg-white/20',
  },
  resolution: {
    hex: '#021F78',
    bg: '#021F7815',
    border: '#021F78',
    text: 'text-white',
    badgeBg: 'bg-white/20',
  },
  eminence: {
    hex: '#661B7D',
    bg: '#661B7D15',
    border: '#661B7D',
    text: 'text-white',
    badgeBg: 'bg-white/20',
  },
  purpureus: {
    hex: '#9E61A9',
    bg: '#9E61A915',
    border: '#9E61A9',
    text: 'text-white',
    badgeBg: 'bg-white/20',
  },
  lightgreen: {
    hex: '#90EE90',
    bg: '#90EE9015',
    border: '#90EE90',
    text: 'text-gray-900',
    badgeBg: 'bg-gray-900/20',
  },
};

