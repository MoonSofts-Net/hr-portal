import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireSuperAdmin } from '../../common/decorators/super-admin.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@RequireSuperAdmin()
@RequirePermissions('admin.settings.update')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants (Super Admin)' })
  findAll(@Query() query: ListTenantsQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create tenant' })
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.userId, user.homeTenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.userId, user.homeTenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete tenant (isActive=false)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.softDelete(id, user.userId, user.homeTenantId);
  }
}
