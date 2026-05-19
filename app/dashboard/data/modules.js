export const modules = [
  { id: 1, name: 'Digital Safety', child: 'Emma', lessons: 4, status: 'done' },
  { id: 2, name: 'Emotional Resilience', child: 'Sophia', lessons: 5, status: 'progress', pct: 50 },
  { id: 3, name: 'Screen Time Balance', child: 'Liam', lessons: 3, status: 'progress', pct: 33 },
  { id: 4, name: 'Online Friendships', child: 'All', lessons: 6, status: 'new' },
]

// Module card gradient palette — one entry per module card, cycled by index.
// Kept as literal saturated colors since the cards always render white text on top,
// so they read correctly in both light and dark themes.
export const moduleColors = [
  { bg: 'linear-gradient(135deg, hsl(214,80%,58%), hsl(214,80%,42%))', badge: 'rgba(0,0,0,0.18)' },
  { bg: 'linear-gradient(135deg, hsl(280,60%,62%), hsl(280,60%,46%))', badge: 'rgba(0,0,0,0.18)' },
  { bg: 'linear-gradient(135deg, hsl(160,55%,48%), hsl(160,55%,34%))', badge: 'rgba(0,0,0,0.18)' },
  { bg: 'linear-gradient(135deg, hsl(20,85%,60%), hsl(20,85%,46%))',   badge: 'rgba(0,0,0,0.18)' },
]
