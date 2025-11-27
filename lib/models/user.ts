/**
 * User Model
 *
 * Handles user authentication and management
 * Passwords are hashed with bcrypt before storage
 */

import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_this';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface User {
  _id?: ObjectId;
  email: string;
  password: string; // Hashed
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  userId: string;
  email: string;
}

/**
 * Get users collection
 */
async function getUsersCollection() {
  const db = await getDatabase();
  return db.collection<User>('users');
}

/**
 * Create a new user
 */
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const users = await getUsersCollection();

  // Check if user already exists
  const existingUser = await users.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user: User = {
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await users.insertOne(user);
  user._id = result.insertedId;

  return user;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await getUsersCollection();
  return users.findOne({ email });
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const users = await getUsersCollection();
  return users.findOne({ _id: new ObjectId(id) });
}

/**
 * Verify user password
 */
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: User): string {
  const payload: UserPayload = {
    userId: user._id!.toString(),
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate user (login)
 */
export async function authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(user, password);

  if (!isValid) {
    return null;
  }

  const token = generateToken(user);

  return { user, token };
}

/**
 * Update user
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const users = await getUsersCollection();

  // If password is being updated, hash it
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }

  updates.updatedAt = new Date();

  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: 'after' }
  );

  return result || null;
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<boolean> {
  const users = await getUsersCollection();
  const result = await users.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/**
 * Get user without password (safe for client)
 */
export function getSafeUser(user: User): Omit<User, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}
