import { NestFactory } from '@nestjs/core'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { FastifyAdapter } from './infra/adapters/http/fastify-adapter'
import { EnvService } from './infra/env/env.service'

async function bootstrap () {
  const fastifyAdapter = new FastifyAdapter()
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter
  )
  await fastifyAdapter.configure(app)
  const envService = app.get(EnvService)
  const nodeEnv = envService.get('NODE_ENV')
  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Template API')
      .setDescription('NestJS API Template with Clean Architecture')
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
