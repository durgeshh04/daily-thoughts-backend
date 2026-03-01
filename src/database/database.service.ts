import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema/index';
import { EnvConfig } from 'src/config/env.config';


@Injectable()
export class DatabaseService implements OnModuleInit {
  public readonly drizzle;
  constructor(
    private configService: ConfigService,
    private env: EnvConfig,
  ) {
    const sql = neon(this.env.databaseUrl);
    this.drizzle = drizzle(sql, { schema });
  }

  async onModuleInit() {
    try {
      await this.drizzle.execute('SELECT 1');
      console.log('✅ Database connected (Drizzle + Neon)');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
}
