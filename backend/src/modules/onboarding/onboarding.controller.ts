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
import { OnboardingService } from './onboarding.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { RejectOnboardingDto } from './dto/reject-onboarding.dto';
import { ListOnboardingQueryDto } from './dto/list-onboarding-query.dto';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get()
  @RequirePermissions('onboarding.read')
  @ApiOperation({ summary: 'List onboarding processes' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ListOnboardingQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(tenantId, query, user);
  }

  @Post()
  @RequirePermissions('onboarding.read', 'onboarding.submit')
  @ApiOperation({ summary: 'Create onboarding process' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateOnboardingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user);
  }

  @Get(':id')
  @RequirePermissions('onboarding.read')
  @ApiOperation({ summary: 'Get onboarding process' })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(tenantId, id, user);
  }

  @Patch(':id')
  @RequirePermissions('onboarding.submit')
  @ApiOperation({ summary: 'Update draft onboarding' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOnboardingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(tenantId, id, dto, user);
  }

  @Post(':id/submit')
  @RequirePermissions('onboarding.submit')
  @ApiOperation({ summary: 'Submit onboarding for review' })
  submit(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.submit(tenantId, id, user);
  }

  @Post(':id/approve')
  @RequirePermissions('onboarding.approve')
  @ApiOperation({ summary: 'Approve onboarding (HR)' })
  approve(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(tenantId, id, user);
  }

  @Post(':id/reject')
  @RequirePermissions('onboarding.reject')
  @ApiOperation({ summary: 'Reject onboarding with reason (HR)' })
  reject(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectOnboardingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(tenantId, id, dto.rejectionReason, user);
  }

  @Get(':id/history')
  @RequirePermissions('onboarding.read')
  @ApiOperation({ summary: 'Onboarding audit history' })
  history(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getHistory(tenantId, id, user);
  }
}
