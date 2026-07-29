import { Controller, Get, MessageEvent, Param, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditQueryDto } from './audit.dto';
import { AuditQueryService } from './audit-query.service';
import { AuditStreamService } from './audit-stream.service';

@Controller('api/audit')
export class AuditController {
  constructor(
    private readonly queryService: AuditQueryService,
    private readonly streamService: AuditStreamService,
  ) {}

  @Get()
  list(@Query() query: AuditQueryDto) {
    return this.queryService.list(query);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.streamService.stream();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.queryService.get(id);
  }
}
