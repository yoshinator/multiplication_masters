import type { MinPriorityQueue } from 'datastructures-js'
import type { UserFact } from '../constants/dataModels'

export function debugQueue(queue?: MinPriorityQueue<UserFact> | null) {
  try {
    // warning: queue.toArray() is allowed and safe for read-only debugging
    const arr = queue?.toArray()
    return (arr ?? []).map((c) => ({
      id: c.id,
      expr: c.expression,
      box: c.box,
      nextDue: c.nextDueTime,
      seen: c.seen,
    }))
  } catch {
    return 'Queue debug failed'
  }
}
