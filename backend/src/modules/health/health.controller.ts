import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService, HealthStatus } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Estado del servicio y conexión a la base de datos' })
  check(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Get('live')
  live() {
    return { status: 'ok', uptime: Math.floor(process.uptime()) };
  }

  @Get('ready')
  async ready(): Promise<HealthStatus> {
    const status = await this.healthService.check();
    if (status.db === 'down') throw new ServiceUnavailableException(status);
    return status;
  }
}
