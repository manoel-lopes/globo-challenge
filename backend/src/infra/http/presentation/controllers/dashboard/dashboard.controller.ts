import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetDashboardSummaryUseCase } from '@/domain/application/usecases/get-dashboard-summary/get-dashboard-summary.usecase'
import { GetDashboardTopSourcesUseCase } from '@/domain/application/usecases/get-dashboard-top-sources/get-dashboard-top-sources.usecase'
import { GetDashboardTrendsUseCase } from '@/domain/application/usecases/get-dashboard-trends/get-dashboard-trends.usecase'
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import {
  DashboardFilterQueryDto,
  dashboardFilterQuerySchema,
  DashboardTopSourcesQueryDto,
  dashboardTopSourcesQuerySchema,
  DashboardTrendsQueryDto,
  dashboardTrendsQuerySchema,
} from './ports/dashboard.protocol'

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor (
    private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
    private readonly getDashboardTrendsUseCase: GetDashboardTrendsUseCase,
    private readonly getDashboardTopSourcesUseCase: GetDashboardTopSourcesUseCase
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary indicators' })
  @ApiOkResponse('Dashboard summary retrieved successfully')
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  async summary (
    @Query(new ZodValidationPipe(dashboardFilterQuerySchema)) query: DashboardFilterQueryDto
  ) {
    return this.getDashboardSummaryUseCase.execute(query)
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get time-bucketed log trends' })
  @ApiOkResponse('Dashboard trends retrieved successfully')
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  async trends (
    @Query(new ZodValidationPipe(dashboardTrendsQuerySchema)) query: DashboardTrendsQueryDto
  ) {
    return this.getDashboardTrendsUseCase.execute(query)
  }

  @Get('top-sources')
  @ApiOperation({ summary: 'Get top log sources by volume or error rate' })
  @ApiOkResponse('Top sources retrieved successfully')
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  async topSources (
    @Query(new ZodValidationPipe(dashboardTopSourcesQuerySchema)) query: DashboardTopSourcesQueryDto
  ) {
    return this.getDashboardTopSourcesUseCase.execute(query)
  }
}
