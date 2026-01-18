export function getWeekDates(date: Date): Date[] {
  const week: Date[] = []
  const current = new Date(date)

  // Get Monday of the current week
  const day = current.getDay()
  const diff = current.getDate() - day + (day === 0 ? -6 : 1)
  current.setDate(diff)

  for (let i = 0; i < 7; i++) {
    week.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return week
}

export function formatDate(date: Date): string {
  // Use local date methods to avoid timezone issues
  // (toISOString() converts to UTC which can shift the date)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getEndOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}
