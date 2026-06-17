import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../security/interfaces/authenticated-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Current user profile with requests summary' })
  getMe(@TenantId() tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyProfile(tenantId, user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile (name, phone, address)' })
  updateMe(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.service.updateMyProfile(tenantId, user, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload profile picture' })
  uploadAvatar(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadAvatar(tenantId, user, file);
  }
}
