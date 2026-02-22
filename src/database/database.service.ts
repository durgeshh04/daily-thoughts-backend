import { neon } from '@neondatabase/serverless';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index';

@Injectable()
export class DatabaseService implements OnModuleInit {
  public db: ReturnType<typeof drizzle>;
  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }
    const sql = neon(connectionString);
    this.db = drizzle(sql, { schema });
  }

  async onModuleInit() {
    try {
      await this.db.execute('SELECT 1');
      console.log('✅ Database connected (Drizzle + Neon)');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
}
