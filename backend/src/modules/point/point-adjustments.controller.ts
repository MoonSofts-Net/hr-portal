import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PointAdjustmentsService } from './point-adjustments.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { CreatePointAdjustmentDto } from './dto/create-point-adjustment.dto';
import { ListPointAdjustmentsQueryDto } from './dto/list-point-adjustments-query.dto';
import { RejectPointAdjustmentDto } from './dto/reject-point-adjustment.dto';

@ApiTags('Point Adjustments')
@ApiBearerAuth()
@Controller('point-adjustments')
export class PointAdjustmentsController {
  constructor(private readonly service: PointAdjustmentsService) {}

  @Get()
  @RequirePermissions('point.read')
  @ApiOperation({ summary: 'List point adjustment requests' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ListPointAdjustmentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(tenantId, query, user);
  }

  @Post()
  @RequirePermissions('point.adjust.request')
  @ApiOperation({ summary: 'Create point adjustment request' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePointAdjustmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user);
  }

  @Get(':id')
  @RequirePermissions('point.read')
  @ApiOperation({ summary: 'Get adjustment request' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(tenantId, id, user);
  }

  @Post(':id/approve')
  @RequirePermissions('point.adjust.approve')
  @ApiOperation({ summary: 'Approve adjustment request' })
  approve(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(tenantId, id, user);
  }

  @Post(':id/reject')
  @RequirePermissions('point.adjust.approve')
  @ApiOperation({ summary: 'Reject adjustment request' })
  reject(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectPointAdjustmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(tenantId, id, dto.reviewComment, user);
  }
}
