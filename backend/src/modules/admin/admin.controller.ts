import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@RequirePermissions('admin.settings.read')
export class AdminController {
  @Get('settings')
  @ApiOperation({ summary: 'System settings placeholder' })
  settings() {
    return {
      branding: { placeholder: true },
      integrations: {
        govbr: false,
        whatsapp: false,
        payroll: false,
        activeDirectory: false,
      },
    };
  }
}
