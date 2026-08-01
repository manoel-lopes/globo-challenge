import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor (envService: EnvService) {
    const adapter = new PrismaPg({
      connectionString: envService.getDatabaseUrl(),
      max: envService.get('DB_POOL_MAX'),
    })
    super({ adapter })
  }

  async onModuleInit () {
    await this.$connect()
  }

  async onModuleDestroy () {
    await this.$disconnect()
  }
}
