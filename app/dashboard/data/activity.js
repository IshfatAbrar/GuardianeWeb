export const alerts = [
  { id: 1, type: 'Unusual activity detected', child: 'Sophia Johnson', time: '2 hours ago', severity: 'medium' },
  { id: 2, type: 'Extended screen time', child: 'Liam Johnson', time: '5 hours ago', severity: 'low' },
  { id: 3, type: 'New message received', child: 'Emma Johnson', time: 'Yesterday', severity: 'low' },
]

export const messages = {
  sophia: [
    { id: 1, from: 'child', text: 'hey mom can I stay out until 10?', time: '3:42 PM' },
    { id: 2, from: 'parent', text: 'Home by 9:30, ok?', time: '3:45 PM' },
    { id: 3, from: 'child', text: 'fine 😒 can you pick me up?', time: '3:46 PM' },
  ],
  emma: [
    { id: 1, from: 'child', text: 'Mom I finished my homework!', time: '2:10 PM' },
    { id: 2, from: 'parent', text: 'Great job Emma! 🎉', time: '2:15 PM' },
  ],
  liam: [
    { id: 1, from: 'child', text: 'Can I play Minecraft after dinner?', time: '5:00 PM' },
    { id: 2, from: 'parent', text: 'Yes, 1 hour max 🕐', time: '5:03 PM' },
  ],
}

export const emergencyContacts = [
  { initials: 'RK', name: 'Dr. Rachel Kim', role: 'School Counselor', danger: false },
  { initials: 'PD', name: 'Police Dept.', role: 'Emergency Services', danger: false },
  { initials: 'GJ', name: 'Grandma June', role: 'Family', danger: false },
  { initials: 'CR', name: 'Crisis Line · 988', role: 'Mental Health Support', danger: true },
]
