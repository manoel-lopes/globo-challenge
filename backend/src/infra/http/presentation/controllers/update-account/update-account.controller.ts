import {
  Body,
  Controller,
  NotFoundException,
  Put,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UpdateAccountUseCase } from '@/domain/application/usecases/update-account/update-account.usecase'
import { CurrentUser } from '@/infra/auth/decorators/current-user.decorator'
import type { AuthUser } from '@/infra/auth/strategies/jwt.strategy'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'
import {
  UpdateAccountBodyDto,
  updateAccountBodySchema,
} from './ports/update-account.protocol'

@ApiTags('Users')
@Controller('users')
export class UpdateAccountController {
  constructor (private readonly updateAccountUseCase: UpdateAccountUseCase) {}

  @Put()
  @ApiOperation({ summary: 'Update user account' })
  @ApiBody({ type: UpdateAccountBodyDto })
  @ApiOkResponse('Account updated successfully')
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('User not found')
  @ApiUnprocessableEntityResponse()
  async handle (
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateAccountBodySchema)) body: UpdateAccountBodyDto
  ) {
    try {
      const { name, email, password } = body
      const updatedUser = await this.updateAccountUseCase.execute({
        userId: user.id,
        name,
        email,
        password,
      })
      return updatedUser
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }
      throw error
    }
  }
}
