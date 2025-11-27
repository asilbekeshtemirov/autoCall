/**
 * MongoDB Connection Helper
 *
 * This provides a singleton MongoDB connection for Next.js
 * Caches the connection in development to avoid creating multiple connections
 */

import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env file');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client for each connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get MongoDB database instance
 */
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  // Database name is extracted from URI, or defaults to 'sipuni-app'
  const dbName = new URL(uri).pathname.substring(1) || 'sipuni-app';
  return client.db(dbName);
}

/**
 * Get MongoDB client (for advanced usage)
 */
export async function getClient(): Promise<MongoClient> {
  return clientPromise;
}

export default clientPromise;
