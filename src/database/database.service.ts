import { Injectable, OnModuleInit } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema/index';
import { EnvConfig } from 'src/config/env.config';

@Injectable()
export class DatabaseService implements OnModuleInit {
  public readonly drizzle;

  constructor(private env: EnvConfig) {
    if (this.env.nodeEnv === 'production') {
      // ✅ Neon (Production)
      const sql = neon(this.env.databaseUrl);
      this.drizzle = drizzleNeon(sql, { schema });
      console.log('🌐 Using Neon database');
    } else {
      // ✅ Local PostgreSQL (Development)
      const pool = new Pool({
        connectionString: this.env.databaseUrl,
      });
      this.drizzle = drizzle(pool, { schema });
      console.log('💻 Using local PostgreSQL');
    }
  }

  async onModuleInit() {
    try {
      await this.drizzle.execute('SELECT 1');
      console.log('✅ Database connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
}
