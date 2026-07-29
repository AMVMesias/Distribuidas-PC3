import { Transform, Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const ENTITIES = ['user', 'reservation', 'payment', 'wine', 'store'] as const;
const ACTIONS = ['create', 'update', 'delete', 'pay', 'cancel', 'expire'] as const;

export class AuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsIn(ENTITIES)
  entity?: string;

  @IsOptional()
  @IsIn(ACTIONS)
  action?: string;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  from?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  to?: Date;
}
