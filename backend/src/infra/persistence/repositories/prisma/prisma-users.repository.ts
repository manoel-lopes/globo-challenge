import { Injectable } from '@nestjs/common'
import type {
  UsersRepository,
} from '@/domain/application/repositories/users.repository'
import { PrismaService } from '@/infra/persistence/prisma.service'
import type { User, UserProps } from '@/domain/enterprise/entities/user.entity'

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor (private readonly prisma: PrismaService) {}

  async create (data: UserProps): Promise<User> {
    const user = await this.prisma.user.create({ data })
    return user
  }

  async findById (userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return null
    return user
  }

  async findByEmail (userEmail: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) return null
    return user
  }
}
