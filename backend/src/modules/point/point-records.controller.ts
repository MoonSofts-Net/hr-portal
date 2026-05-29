import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PointRecordsService } from './point-records.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { ListPointRecordsQueryDto } from './dto/list-point-records-query.dto';

@ApiTags('Point Records')
@ApiBearerAuth()
@Controller('point-records')
export class PointRecordsController {
  constructor(private readonly service: PointRecordsService) {}

  @Get()
  @RequirePermissions('point.read')
  @ApiOperation({ summary: 'List point mirror records (read-only)' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ListPointRecordsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(tenantId, query, user);
  }

  @Get('me')
  @RequirePermissions('point.read')
  @ApiOperation({ summary: 'Current user point mirror records' })
  findMine(
    @CurrentTenant() tenantId: string,
    @Query() query: ListPointRecordsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findMine(tenantId, query, user);
  }
}
