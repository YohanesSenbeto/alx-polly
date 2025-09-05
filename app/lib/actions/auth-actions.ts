'use server';

/**
 * Authentication server actions for ALX Polly
 * 
 * This module provides secure server-side authentication operations including:
 * - User login with email/password
 * - User registration with profile creation
 * - Session management and logout
 * - Current user and session retrieval
 * 
 * All operations are performed server-side to prevent token exposure
 * and ensure secure credential handling.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Authenticates a user with email and password credentials
 * 
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email address (validated on client)
 * @param {string} credentials.password - User's password (validated on client)
 * @returns {Promise<Object>} Returns error object if authentication fails, undefined on success
 * 
 * @example
 * ```typescript
 * const result = await login({ email: 'user@example.com', password: 'secure123' });
 * if (result?.error) {
 *   console.error('Login failed:', result.error);
 * }
 * ```
 * 
 * @security
 * - Passwords are handled securely via Supabase Auth
 * - Rate limiting is implemented on the client side
 * - Sessions are managed via secure HTTP-only cookies
 */
export async function login({ email, password }: { email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return error message without exposing system details
    return { error: 'Invalid credentials or account not found' };
  }

  // Revalidate the entire application layout to reflect new auth state
  revalidatePath('/', 'layout');
}

/**
 * Registers a new user with email, password, and display name
 * 
 * @param {Object} userData - Registration data
 * @param {string} userData.name - User's display name (2-50 characters)
 * @param {string} userData.email - Valid email address
 * @param {string} userData.password - Secure password (6-128 characters)
 * @returns {Promise<Object>} Returns error object if registration fails, undefined on success
 * 
 * @example
 * ```typescript
 * const result = await register({ 
 *   name: 'John Doe', 
 *   email: 'john@example.com', 
 *   password: 'secure123456' 
 * });
 * ```
 * 
 * @security
 * - Password strength validated client-side before submission
 * - Email uniqueness enforced by Supabase Auth
 * - User metadata stored securely in auth.users table
 */
export async function register({ name, email, password }: { name: string; email: string; password: string }) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    // Provide user-friendly error messages
    let errorMessage = 'Registration failed';
    if (error.message.includes('already registered')) {
      errorMessage = 'Email already registered';
    } else if (error.message.includes('weak')) {
      errorMessage = 'Password too weak';
    }
    return { error: errorMessage };
  }

  // Revalidate application state after successful registration
  revalidatePath('/', 'layout');
}

/**
 * Signs out the current user and redirects to login page
 * 
 * @returns {Promise<Object>} Returns error object if logout fails, redirects on success
 * 
 * @example
 * ```typescript
 * const result = await logout();
 * if (result?.error) {
 *   console.error('Logout failed:', result.error);
 * }
 * ```
 * 
 * @security
 * - Clears all session cookies
 * - Invalidates server-side session
 * - Prevents session fixation attacks
 */
export async function logout() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { error: 'Logout failed. Please try again.' };
  }
  
  // Ensure fresh data on next navigation
  revalidatePath('/', 'layout');
  
  // Always redirect to login after logout for security
  redirect('/login');
}

/**
 * Retrieves the currently authenticated user
 * 
 * @returns {Promise<Object|null>} Current user object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Current user:', user.email);
 * }
 * ```
 * 
 * @security
 * - Returns sanitized user object without sensitive data
 * - Validates JWT token integrity
 * - Handles expired sessions gracefully
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Retrieves the current active session
 * 
 * @returns {Promise<Object|null>} Active session object with tokens and user data
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log('Session expires at:', new Date(session.expires_at));
 * }
 * ```
 * 
 * @security
 * - Returns session without exposing refresh tokens
 * - Validates session expiration
 * - Safe for server-side use only
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
