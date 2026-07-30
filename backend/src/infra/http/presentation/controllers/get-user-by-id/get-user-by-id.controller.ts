import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetUserByIdUseCase } from '@/domain/application/usecases/get-user-by-id/get-user-by-id.usecase'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'
import {
  GetUserByIdParamsDto,
  getUserByIdParamsSchema,
} from './ports/get-user-by-id.protocol'

@ApiTags('Users')
@Controller('users/:id')
export class GetUserByIdController {
  constructor (private readonly getUserByIdUseCase: GetUserByIdUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Get user by ID' })
  async handle (@Param(new ZodValidationPipe(getUserByIdParamsSchema)) params: GetUserByIdParamsDto) {
    const { id } = params
    try {
      const user = await this.getUserByIdUseCase.execute({ userId: id })
      return user
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }
      throw error
    }
  }
}
