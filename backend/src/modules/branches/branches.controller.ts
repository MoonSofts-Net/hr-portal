import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Get()
  @RequirePermissions('admin.branches.read', 'users.read')
  @ApiOperation({ summary: 'List branches (filiais) for the current company' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: ListBranchesQueryDto) {
    return this.service.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('admin.branches.manage')
  @ApiOperation({ summary: 'Create a branch' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(tenantId, dto, user.userId);
  }

  @Get(':id')
  @RequirePermissions('admin.branches.read', 'users.read')
  @ApiOperation({ summary: 'Get branch by ID' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('admin.branches.manage')
  @ApiOperation({ summary: 'Update branch' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(tenantId, id, dto, user.userId);
  }

  @Delete(':id')
  @RequirePermissions('admin.branches.manage')
  @ApiOperation({ summary: 'Deactivate branch (isActive=false)' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.softDelete(tenantId, id, user.userId);
  }
}
