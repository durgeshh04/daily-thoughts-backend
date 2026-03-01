import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfig } from 'src/config/env.config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [EnvConfig],
      useFactory: (env: EnvConfig) => ({
        secret: env.jwtAccessSecret,
        signOptions: { expiresIn: Number(env.jwtAccessExpiration) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
