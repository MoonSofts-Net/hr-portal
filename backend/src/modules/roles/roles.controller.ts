import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions('users.read', 'users.create', 'admin.roles.manage')
  @ApiOperation({ summary: 'List tenant roles' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: PaginationQueryDto) {
    return this.service.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'Create role' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user.userId);
  }

  @Get(':id')
  @RequirePermissions('users.read', 'users.create', 'admin.roles.manage')
  @ApiOperation({ summary: 'Get role with permissions' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'Update role' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(tenantId, id, dto, user.userId);
  }

  @Delete(':id')
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'Delete role' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(tenantId, id, user.userId);
  }

  @Post(':id/permissions')
  @RequirePermissions('admin.roles.manage')
  @ApiOperation({ summary: 'Replace role permissions (audited)' })
  setPermissions(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: SetRolePermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.setPermissions(tenantId, id, dto.permissionIds, user.userId);
  }
}
