import { NestFactory } from '@nestjs/core'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { FastifyAdapter } from './infra/adapters/http/fastify-adapter'
import { EnvService } from './infra/env/env.service'
import { AllExceptionsFilter } from './infra/http/presentation/filters/all-exceptions.filter'

async function bootstrap () {
  const fastifyAdapter = new FastifyAdapter()
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter
  )
  await fastifyAdapter.configure(app)
  app.enableShutdownHooks()
  app.useGlobalFilters(new AllExceptionsFilter())
  const envService = app.get(EnvService)
  if (envService.get('ENABLE_SWAGGER')) {
    const config = new DocumentBuilder()
      .setTitle('Log Analysis Platform API')
      .setDescription('Import, query, and analyze structured log data')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, document)
  }
  const port = envService.get('PORT')
  await app.listen(port, '0.0.0.0')
}

bootstrap()
