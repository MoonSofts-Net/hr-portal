import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { SuperAdminGuard } from '../guards/super-admin.guard';

export const RequireSuperAdmin = () =>
  applyDecorators(
    UseGuards(SuperAdminGuard),
    ApiForbiddenResponse({ description: 'Super Administrator required' }),
  );
