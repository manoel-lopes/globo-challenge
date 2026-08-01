import type { ClassifiedLogLine, ClassifierStrategy } from './classified-log-line'
import { heuristicClassifier } from './classifiers/heuristic.classifier'
import { jsonLineClassifier } from './classifiers/json-line.classifier'
import { plainTextClassifier } from './classifiers/plain-text.classifier'

export class LogClassifierRegistry {
  private readonly strategies: ClassifierStrategy[]

  constructor (strategies: ClassifierStrategy[] = [
    jsonLineClassifier,
    plainTextClassifier,
    heuristicClassifier,
  ]) {
    this.strategies = strategies
  }

  classify (rawLine: string, importedAt: Date = new Date()): ClassifiedLogLine {
    const line = rawLine.replace(/\r$/, '')
    if (!line.trim()) {
      return {
        level: 'UNKNOWN',
        timestamp: importedAt,
        source: null,
        message: '',
        metadata: null,
        rawLine: line,
        failed: true,
      }
    }
    for (const strategy of this.strategies) {
      const result = strategy.classify(line, importedAt)
      if (result) return result
    }
    return {
      level: 'UNKNOWN',
      timestamp: importedAt,
      source: null,
      message: line,
      metadata: null,
      rawLine: line,
      failed: true,
    }
  }
}
