import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateAccountUseCase } from '@/domain/application/usecases/create-account/create-account.usecase'
import { UserWithEmailAlreadyRegisteredError } from '@/domain/application/usecases/create-account/errors/user-with-email-already-registered.error'
import { Public } from '@/infra/auth/decorators/public.decorator'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import {
  CreateAccountBodyDto,
  createAccountBodySchema,
} from './ports/create-account.protocol'

@ApiTags('Users')
@Controller('users')
export class CreateAccountController {
  constructor (private readonly createAccountUseCase: CreateAccountUseCase) {}

  @Public()
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiBody({ type: CreateAccountBodyDto })
  @ApiCreatedResponse('Account created successfully')
  @ApiBadRequestResponse()
  @ApiConflictResponse('Conflict - email already registered')
  @ApiUnprocessableEntityResponse()
  async handle (@Body(new ZodValidationPipe(createAccountBodySchema)) body: CreateAccountBodyDto) {
    try {
      const { name, email, password } = body
      await this.createAccountUseCase.execute({ name, email, password })
    } catch (error) {
      if (error instanceof UserWithEmailAlreadyRegisteredError) {
        throw new ConflictException(error.message)
      }
      throw error
    }
  }
}
