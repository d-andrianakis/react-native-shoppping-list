import pgPromise from 'pg-promise';
import { env } from './env';

// Initialize pg-promise
const pgp = pgPromise({
  // Initialization options
  error: (error, e) => {
    if (e.cn) {
      // Connection error
      console.error('Database connection error:', error);
    }
  },
});

// Database connection configuration
// Prefer DATABASE_URL if available, otherwise fall back to individual fields
const dbConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      max: 30,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: env.DB_SSL_ENABLED ? {
        rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
      } : false,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      max: 30,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: env.DB_SSL_ENABLED ? {
        rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
      } : false,
    };

// Create database instance
export const db = pgp(dbConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  await pgp.end();
  console.log('Database connection pool closed');
};
