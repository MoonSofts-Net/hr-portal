import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecurityModule } from '../../security/security.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PermissionsResolverService } from './services/permissions-resolver.service';

@Module({
  imports: [
    SecurityModule,
    AuditLogsModule,
    IntegrationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: config.get<string>('jwt.accessExpiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenService,
    SessionService,
    PermissionsResolverService,
  ],
  exports: [
    AuthService,
    JwtModule,
    TokenService,
    SessionService,
    PermissionsResolverService,
  ],
})
export class AuthModule {}
