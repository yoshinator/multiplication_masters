import type { MinPriorityQueue } from 'datastructures-js'
import type { UserCard } from '../constants/dataModels'

export function debugQueue(queue?: MinPriorityQueue<UserCard> | null) {
  try {
    // warning: queue.toArray() is allowed and safe for read-only debugging
    const arr = queue?.toArray()
    return (arr ?? []).map((c) => ({
      id: c.id,
      expr: c.expression,
      box: c.box,
      nextDue: c.nextDueTime,
      seen: c.seen,
      group: c.group,
      table: c.table,
    }))
  } catch {
    return 'Queue debug failed'
  }
}
