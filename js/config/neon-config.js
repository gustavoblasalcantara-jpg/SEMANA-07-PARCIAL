import { neon } from 'https://esm.sh/@neondatabase/serverless';

// Conexión oficial a tu base de datos en Neon
const DATABASE_URL = 'postgresql://neondb_owner:npg_CLyZ9GarBRJ3@ep-orange-dew-b4tk6sn7-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const sql = neon(DATABASE_URL);