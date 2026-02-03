// Predefined color palette for tags - highly distinct and contrasting
const TAG_COLORS = [
  { bg: 'rgba(239, 68, 68, 0.18)', border: 'rgba(239, 68, 68, 0.5)', text: '#ef4444' },    // Red
  { bg: 'rgba(59, 130, 246, 0.18)', border: 'rgba(59, 130, 246, 0.5)', text: '#3b82f6' },  // Blue
  { bg: 'rgba(34, 197, 94, 0.18)', border: 'rgba(34, 197, 94, 0.5)', text: '#22c55e' },    // Green
  { bg: 'rgba(249, 115, 22, 0.18)', border: 'rgba(249, 115, 22, 0.5)', text: '#f97316' },  // Orange
  { bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.5)', text: '#a855f7' },  // Purple
  { bg: 'rgba(6, 182, 212, 0.18)', border: 'rgba(6, 182, 212, 0.5)', text: '#06b6d4' },    // Cyan
  { bg: 'rgba(236, 72, 153, 0.18)', border: 'rgba(236, 72, 153, 0.5)', text: '#ec4899' },  // Pink
  { bg: 'rgba(234, 179, 8, 0.18)', border: 'rgba(234, 179, 8, 0.5)', text: '#eab308' },    // Yellow
  { bg: 'rgba(99, 102, 241, 0.18)', border: 'rgba(99, 102, 241, 0.5)', text: '#6366f1' },  // Indigo
  { bg: 'rgba(20, 184, 166, 0.18)', border: 'rgba(20, 184, 166, 0.5)', text: '#14b8a6' },  // Teal
  { bg: 'rgba(217, 70, 239, 0.18)', border: 'rgba(217, 70, 239, 0.5)', text: '#d946ef' },  // Fuchsia
  { bg: 'rgba(132, 204, 22, 0.18)', border: 'rgba(132, 204, 22, 0.5)', text: '#84cc16' },  // Lime
  { bg: 'rgba(244, 63, 94, 0.18)', border: 'rgba(244, 63, 94, 0.5)', text: '#f43f5e' },    // Rose
  { bg: 'rgba(14, 165, 233, 0.18)', border: 'rgba(14, 165, 233, 0.5)', text: '#0ea5e9' },  // Sky
  { bg: 'rgba(251, 146, 60, 0.18)', border: 'rgba(251, 146, 60, 0.5)', text: '#fb923c' },  // Amber
  { bg: 'rgba(192, 38, 211, 0.18)', border: 'rgba(192, 38, 211, 0.5)', text: '#c026d3' },  // Magenta
];

// Light mode colors - darker text for better visibility
const TAG_COLORS_LIGHT = [
  { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#dc2626' },    // Red
  { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#2563eb' },  // Blue
  { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', text: '#16a34a' },    // Green
  { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#ea580c' },  // Orange
  { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: '#9333ea' },  // Purple
  { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', text: '#0891b2' },    // Cyan
  { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: '#db2777' },  // Pink
  { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)', text: '#ca8a04' },    // Yellow
  { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)', text: '#4f46e5' },  // Indigo
  { bg: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.4)', text: '#0d9488' },  // Teal
  { bg: 'rgba(217, 70, 239, 0.15)', border: 'rgba(217, 70, 239, 0.4)', text: '#c026d3' },  // Fuchsia
  { bg: 'rgba(132, 204, 22, 0.15)', border: 'rgba(132, 204, 22, 0.4)', text: '#65a30d' },  // Lime
  { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', text: '#e11d48' },    // Rose
  { bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)', text: '#0284c7' },  // Sky
  { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)', text: '#d97706' },  // Amber
  { bg: 'rgba(192, 38, 211, 0.15)', border: 'rgba(192, 38, 211, 0.4)', text: '#a21caf' },  // Magenta
];

// Generate a consistent hash from string
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Get color for a tag (returns consistent color based on tag name)
export function getTagColor(tagName, isLightMode = false) {
  const colors = isLightMode ? TAG_COLORS_LIGHT : TAG_COLORS;
  const index = hashString(tagName.toLowerCase()) % colors.length;
  return colors[index];
}

// Get inline style for a tag
export function getTagStyle(tagName, isLightMode = false) {
  const color = getTagColor(tagName, isLightMode);
  return {
    backgroundColor: color.bg,
    borderColor: color.border,
    color: color.text,
  };
}

export default getTagColor;
