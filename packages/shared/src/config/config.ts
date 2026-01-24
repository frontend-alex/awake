/**
 * Application configuration module
 * 
 * Centralized configuration for shared application settings including:
 * - Application metadata
 * - User management rules and constraints
 * - OAuth provider enablement flags
 * 
 * @module @shared/config/config
 */

/**
 * Password validation rules configuration
 */
export interface PasswordRules {
  /** Minimum password length requirement */
  readonly minLength: number;
  /** Whether uppercase letters are required */
  readonly requireUppercase: boolean;
  /** Whether lowercase letters are required */
  readonly requireLowercase: boolean;
  /** Whether numeric characters are required */
  readonly requireNumber: boolean;
  /** Whether special characters are required */
  readonly requireSymbol: boolean;
}

/**
 * User-related configuration settings
 */
export interface UserConfig {
  /** List of user fields that can be updated via API */
  readonly allowedUpdates: readonly string[];
  /** Password validation rules */
  readonly passwordRules: PasswordRules;
}

/**
 * OAuth provider enablement configuration
 */
export interface OAuthProviders {
  readonly google: boolean;
  readonly github: boolean;
  readonly facebook: boolean;
  readonly twitter: boolean;
  readonly linkedin: boolean;
  readonly instagram: boolean;
}

/**
 * Application metadata configuration
 */
export interface AppConfig {
  /** Application name */
  readonly name: string;
}

/**
 * Root application configuration interface
 */
export interface ApplicationConfig {
  readonly app: AppConfig;
  readonly user: UserConfig;
  readonly providers: OAuthProviders;
}

/**
 * Application configuration object
 * 
 * This configuration is shared across the monorepo and defines:
 * - Application branding and metadata
 * - User management policies and validation rules
 * - OAuth provider availability
 * 
 * @example
 * ```typescript
 * import { config } from '@shared/config/config';
 * 
 * // Access app name
 * const appName = config.app.name;
 * 
 * // Check if provider is enabled
 * if (config.providers.google) {
 *   // Initialize Google OAuth
 * }
 * 
 * // Validate password against rules
 * const isValid = password.length >= config.user.passwordRules.minLength;
 * ```
 */
export const config: ApplicationConfig = {
  app: {
    name: "MonoMERN",
  },
  user: {
    allowedUpdates: ['username', 'email', 'password', 'emailVerified'] as const,
    passwordRules: {
      minLength: 6,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSymbol: true,
    },
  },
  providers: {
    google: true,
    github: true,
    facebook: true,
    twitter: false,
    linkedin: false,
    instagram: false,
  },
} as const;

/**
 * Type-safe accessor for allowed user update fields
 */
export const ALLOWED_USER_UPDATE_FIELDS = config.user.allowedUpdates;

/**
 * Type-safe accessor for password validation rules
 */
export const PASSWORD_RULES = config.user.passwordRules;

/**
 * Type-safe accessor for OAuth provider configuration
 */
export const OAUTH_PROVIDERS = config.providers;
