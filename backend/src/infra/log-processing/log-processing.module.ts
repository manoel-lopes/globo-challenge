import { Module } from '@nestjs/common'
import { LogClassifierRegistry } from './log-classifier/log-classifier.registry'
import { LogFileParser } from './log-file/log-file.parser'

@Module({
  providers: [LogClassifierRegistry, LogFileParser],
  exports: [LogClassifierRegistry, LogFileParser],
})
export class LogProcessingModule {}
