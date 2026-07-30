import { detectLevelKeyword } from '../helpers/log-level.helper'
import type { ClassifierStrategy } from '../types/classified-log-line'

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
