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

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export interface RecurrenceRule {
  frequency: 'weekly' | 'monthly'
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  endType: 'never' | 'on_date' | 'after_count'
  endDate?: string
  count?: number
}

export function generateRecurrenceInstances(
  startDate: Date,
  endDate: Date,
  rule: RecurrenceRule,
  maxInstances: number = 52
): Array<{ start: Date; end: Date }> {
  const instances: Array<{ start: Date; end: Date }> = []
  const duration = endDate.getTime() - startDate.getTime()

  // Determine the absolute end date
  const defaultEnd = addWeeks(startDate, 52) // default 1 year
  const absoluteEnd = rule.endType === 'on_date' && rule.endDate
    ? new Date(rule.endDate)
    : defaultEnd

  const maxCount = rule.endType === 'after_count' && rule.count
    ? rule.count
    : maxInstances

  if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    // Weekly recurrence
    let currentDate = new Date(startDate)
    // Start from the beginning of the week containing startDate
    const startDay = currentDate.getDay()
    currentDate.setDate(currentDate.getDate() - startDay) // Go to Sunday

    let weekCount = 0

    while (instances.length < maxCount && currentDate <= absoluteEnd) {
      // Check each day of the week
      for (let dayOffset = 0; dayOffset < 7 && instances.length < maxCount; dayOffset++) {
        const checkDate = new Date(currentDate)
        checkDate.setDate(checkDate.getDate() + dayOffset)

        if (checkDate < startDate) continue // Skip days before start
        if (checkDate > absoluteEnd) break // Stop if past end

        const dayOfWeek = checkDate.getDay()
        if (rule.daysOfWeek.includes(dayOfWeek)) {
          // Copy the time from startDate to this day
          const instanceStart = new Date(checkDate)
          instanceStart.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds())

          instances.push({
            start: instanceStart,
            end: new Date(instanceStart.getTime() + duration)
          })
        }
      }

      // Move to the next interval
      weekCount++
      currentDate.setDate(currentDate.getDate() + 7 * rule.interval)
    }
  } else if (rule.frequency === 'monthly' && rule.dayOfMonth) {
    // Monthly recurrence
    let currentDate = new Date(startDate)
    currentDate.setDate(rule.dayOfMonth)

    // If the day has already passed this month, start next month
    if (currentDate < startDate) {
      currentDate = addMonths(currentDate, 1)
    }

    while (instances.length < maxCount && currentDate <= absoluteEnd) {
      // Handle months with fewer days
      const targetDay = rule.dayOfMonth
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      const actualDay = Math.min(targetDay, lastDayOfMonth)

      const instanceStart = new Date(currentDate)
      instanceStart.setDate(actualDay)
      instanceStart.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds())

      if (instanceStart >= startDate && instanceStart <= absoluteEnd) {
        instances.push({
          start: instanceStart,
          end: new Date(instanceStart.getTime() + duration)
        })
      }

      currentDate = addMonths(currentDate, rule.interval)
    }
  }

  return instances
}
