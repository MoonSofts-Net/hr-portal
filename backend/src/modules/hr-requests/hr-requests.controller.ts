import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HrRequestsService } from './hr-requests.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { CreateHrRequestDto } from './dto/create-hr-request.dto';
import { UpdateHrRequestStatusDto } from './dto/update-hr-request-status.dto';
import { CreateHrRequestMessageDto } from './dto/create-hr-request-message.dto';
import { ListHrRequestsQueryDto } from './dto/list-hr-requests-query.dto';

@ApiTags('HR Requests')
@ApiBearerAuth()
@Controller('hr-requests')
export class HrRequestsController {
  constructor(private readonly service: HrRequestsService) {}

  @Get()
  @RequirePermissions('hr_requests.read')
  @ApiOperation({ summary: 'List HR requests' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ListHrRequestsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(tenantId, query, user);
  }

  @Post()
  @RequirePermissions('hr_requests.create')
  @ApiOperation({ summary: 'Create HR request' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateHrRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user);
  }

  @Get(':id')
  @RequirePermissions('hr_requests.read')
  @ApiOperation({ summary: 'Get HR request with messages' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(tenantId, id, user);
  }

  @Patch(':id/status')
  @RequirePermissions('hr_requests.respond')
  @ApiOperation({ summary: 'Update HR request status' })
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHrRequestStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateStatus(tenantId, id, dto, user);
  }

  @Post(':id/messages')
  @RequirePermissions('hr_requests.read', 'hr_requests.respond', 'hr_requests.create')
  @ApiOperation({ summary: 'Add message to HR request' })
  addMessage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateHrRequestMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.addMessage(tenantId, id, dto.body, dto.isInternal ?? false, user);
  }
}
