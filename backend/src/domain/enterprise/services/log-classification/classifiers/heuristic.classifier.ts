import type { ClassifierStrategy } from '../classified-log-line'
import { detectLevelKeyword } from '../log-level.helper'

export const heuristicClassifier: ClassifierStrategy = {
  name: 'heuristic',
  classify (rawLine, importedAt) {
    const level = detectLevelKeyword(rawLine) ?? 'UNKNOWN'
    return {
      level,
      timestamp: importedAt,
      source: null,
      message: rawLine,
      metadata: null,
      rawLine,
      failed: level === 'UNKNOWN',
    }
  },
}
