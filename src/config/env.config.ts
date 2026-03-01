import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfig {
  constructor(private configService: ConfigService) {}

  // Application
  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get frontendUrl(): string {
    return this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
  }

  // Database
  get databaseUrl(): string {
    const url = this.configService.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    return url;
  }

  // JWT
  get jwtAccessSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_ACCESS_SECRET is not defined in environment variables',
      );
    }
    return secret;
  }

  get jwtRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables',
      );
    }
    return secret;
  }

  get jwtAccessExpiration(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
  }

  get jwtRefreshExpiration(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  // Google OAuth
  get googleClientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID', '');
  }

  get googleClientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET', '');
  }

  get googleCallbackUrl(): string {
    return this.configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:3000/v1/auth/google/callback',
    );
  }

  // Logging
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'info');
  }

  // Helper methods
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
