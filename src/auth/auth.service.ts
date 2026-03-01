import { BadRequestException, Injectable } from '@nestjs/common';
import { SignupDto } from './dto/SignupDto';
import { DatabaseService } from 'src/database/database.service';
import { users, refreshTokens } from '../database/schema/index';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EnvConfig } from 'src/config/env.config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private env: EnvConfig,
    private jwtService: JwtService,
  ) {}
  async signup(dto: SignupDto) {
    try {
      const [existingUser] = await this.db.drizzle
        .select()
        .from(users)
        .where(eq(users.email, dto.email))
        .limit(1);

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      const [existingUsername] = await this.db.drizzle
        .select()
        .from(users)
        .where(eq(users.username, dto.username))
        .limit(1);

      if (existingUsername) {
        throw new BadRequestException('Username already taken');
      }

      // hashing password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // create user
      const [user] = await this.db.drizzle
        .insert(users)
        .values({
          email: dto.email,
          fullName: dto.fullname.trim(),
          password: hashedPassword,
          username: dto.username,
          authProvider: 'LOCAL',
          isEmailVerified: false,
        })
        .returning();
      const tokens = await this.generateTokens(user.id, user.email);
      return {
        ...tokens,
        user: {
          email: user.email,
          fullname: user.fullName,
          username: user.username,
        },
      };
    } catch (error) {
      console.log('Signup failed', error);
      throw error;
    }
  }

  private async generateTokens(userId: string, email: string): Promise<any> {
    const payload: JwtPayload = { sub: userId, email };

    // accessToken and refreshToken creation
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.env.jwtAccessSecret,
        expiresIn: Number(this.env.jwtAccessExpiration),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.env.jwtRefreshSecret,
        expiresIn: Number(this.env.jwtRefreshExpiration),
      }),
    ]);
    const expiresAt = new Date();
    const refreshExpirationDays = 7;
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);
    await this.db.drizzle.insert(refreshTokens).values({
      token: refreshToken,
      userId,
      expiresAt,
    });
    return { accessToken, refreshToken };
  }
}
