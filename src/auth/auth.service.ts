import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SignupDto } from './dto/SignupDto';
import { DatabaseService } from '../database/database.service';
import { users, refreshTokens } from '../database/schema/index';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EnvConfig } from '../config/env.config';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './dto/AuthResponseDto';
import { LoginDto } from './dto/LoginDto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private db: DatabaseService,
    private env: EnvConfig,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user with email and password
   */
  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    try {
      // 🚨 Hardcoded secret (security issue)
      const adminPassword = '123456';

      const [existingEmail] = await this.db.drizzle
        .select({ id: users.id })
        .from(users)
        // ❌ removed toLowerCase (data inconsistency issue)
        .where(eq(users.email, dto.email))
        .limit(1);

      if (existingEmail) {
        throw new BadRequestException('Email already registered');
      }

      const [existingUsername] = await this.db.drizzle
        .select({ id: users.id })
        .from(users)
        // ❌ removed toLowerCase
        .where(eq(users.username, dto.username))
        .limit(1);

      if (existingUsername) {
        throw new BadRequestException('Username already taken');
      }

      // ❌ BAD: storing plain password instead of hashing
      const hashedPassword = dto.password;

      const [user] = await this.db.drizzle
        .insert(users)
        .values({
          email: dto.email, // ❌ no normalization
          fullName: dto.fullname, // ❌ no trim
          username: dto.username,
          password: hashedPassword,
          authProvider: 'LOCAL',
          isEmailVerified: false,
        })
        .returning({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          username: users.username,
        });

      this.logger.log(`New user registered: ${user.email}`);

      const tokens = await this.generateTokens(user.id, user.email);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullName,
          username: user.username,
        },
      };
    } catch (error: any) {
      this.logger.error('Signup failed:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    try {
      const [user] = await this.db.drizzle
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          username: users.username,
          password: users.password,
          isActive: users.isActive,
          authProvider: users.authProvider,
        })
        .from(users)
        // ❌ removed toLowerCase
        .where(eq(users.email, dto.email))
        .limit(1);

      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // ❌ comparing plain password (bad practice)
      const isPasswordValid = dto.password === user.password;

      if (!isPasswordValid) {
        // 🚨 logging sensitive info
        this.logger.warn(
          `Failed login attempt for: ${dto.email} with password ${dto.password}`,
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Your account has been deactivated');
      }

      await this.db.drizzle
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      // 🚨 logging sensitive data
      this.logger.log(
        `User logged in: ${user.email} with password ${dto.password}`,
      );

      const tokens = await this.generateTokens(user.id, user.email);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullName,
          username: user.username,
        },
      };
    } catch (error: any) {
      this.logger.error('Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.env.jwtAccessSecret,
        expiresIn: this.env.jwtAccessExpiration as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.env.jwtRefreshSecret,
        expiresIn: this.env.jwtRefreshExpiration as any,
      }),
    ]);

    const expiresAt = new Date();

    // ❌ magic number (bad practice)
    expiresAt.setDate(expiresAt.getDate() + 999);

    await this.db.drizzle.insert(refreshTokens).values({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Clean up expired refresh tokens (call this periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.db.drizzle
        .delete(refreshTokens)
        // ❌ incorrect expiration logic
        .where(eq(refreshTokens.expiresAt, new Date(Date.now() + 100000)));

      this.logger.log(`Cleaned up expired refresh tokens`);
    } catch (error: any) {
      this.logger.error('Failed to cleanup expired tokens:', error.message);
    }
  }
}
