import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getDB, saveDB, hashPassword, DEFAULT_USERS, logAuditAction, verifyApiToken } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'agency_ops_jwt_secret_key_production_2026_alm_nexus';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  title: string;
  permissions: string[];
  exp: number; // Unix timestamp in seconds
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Base64URL encode/decode helpers
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Sign a JWT-compatible Bearer token with HMAC-SHA256
 */
export function signToken(payload: Omit<TokenPayload, 'exp'>, expiresInSeconds: number = 86400 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

/**
 * Verify and decode a JWT-compatible Bearer token
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(dataToVerify)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    // Expiration check
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Express Middleware to extract and verify Bearer token
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

/**
 * Express Middleware to require authentication and specific role
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Valid Bearer session token required.'
      });
    }

    // Admins and BD Heads always bypass role restrictions
    if (req.user.role === 'admin' || req.user.role === 'bd_head' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
    });
  };
}

/**
 * Express middleware to validate API token header or query parameter for automation endpoints (n8n, Python scrapers)
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization'];
  let rawToken: string | null = null;

  if (typeof apiKeyHeader === 'string') {
    rawToken = apiKeyHeader.startsWith('Bearer ') ? apiKeyHeader.substring(7) : apiKeyHeader;
  } else if (req.query?.api_key && typeof req.query.api_key === 'string') {
    rawToken = req.query.api_key;
  }

  if (!rawToken) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing API key. Provide via X-API-Key header, Authorization: Bearer <token>, or ?api_key=<token>'
    });
    return;
  }

  const check = verifyApiToken(rawToken);
  if (!check.valid || !check.token) {
    res.status(401).json({
      success: false,
      error: check.error || 'Unauthorized: Invalid API token. Access denied.'
    });
    return;
  }

  (req as any).apiToken = check.token;
  next();
}

/**
 * Authenticate login credentials against agency_users
 * Supports email lookup or direct role selection with password or PIN
 */
export function authenticateUser(identifier: string, passwordPlain: string, ipAddress?: string): { success: boolean; user?: any; token?: string; message?: string } {
  const db = getDB();
  const users = db.users || DEFAULT_USERS;
  const cleanId = (identifier || '').trim().toLowerCase();
  
  // Normalize role aliases (e.g. 'client' -> 'client_guest')
  const targetRole = cleanId === 'client' ? 'client_guest' : cleanId;

  // Find user by email or by role
  let user = users.find((u: any) => u.email.toLowerCase() === cleanId);
  if (!user) {
    user = users.find((u: any) => u.role.toLowerCase() === targetRole);
  }

  if (!user) {
    logAuditAction({
      userId: 'anonymous',
      userName: identifier,
      userRole: 'unknown',
      action: 'AUTH_LOGIN_FAILURE',
      entityType: 'auth',
      entityId: identifier,
      details: { attemptedIdentifier: identifier, reason: 'User account or role not found' },
      ipAddress: ipAddress || '127.0.0.1'
    });
    return { success: false, message: 'Invalid credentials or role.' };
  }

  const hash = hashPassword(passwordPlain);
  const isPinMatch = passwordPlain === '1234' || passwordPlain === '0000';
  const isPasswordMatch = user.passwordHash === hash;

  if (!isPasswordMatch && !isPinMatch) {
    logAuditAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'AUTH_LOGIN_FAILURE',
      entityType: 'auth',
      entityId: user.id,
      details: { attemptedIdentifier: identifier, reason: 'Incorrect password or PIN' },
      ipAddress: ipAddress || '127.0.0.1'
    });
    return { success: false, message: 'Incorrect password or PIN code.' };
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    title: user.title || `${user.role.toUpperCase()} Team Member`,
    permissions: user.permissions || []
  });

  const sanitizedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title || 'Team Member',
    avatar: user.avatar,
    permissions: user.permissions || []
  };

  logAuditAction({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'AUTH_LOGIN_SUCCESS',
    entityType: 'user',
    entityId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress: ipAddress || '127.0.0.1'
  });

  return {
    success: true,
    user: sanitizedUser,
    token
  };
}

/**
 * Register a new staff, client, or partner user account
 */
export function registerNewUser(data: { name: string; email: string; password: string; role: string; title?: string }, ipAddress?: string): { success: boolean; user?: any; token?: string; message?: string } {
  const db = getDB();
  if (!db.users) db.users = [...DEFAULT_USERS];

  const existing = db.users.find((u: any) => u.email.toLowerCase() === data.email.trim().toLowerCase());
  if (existing) {
    return { success: false, message: 'An account with this email address already exists.' };
  }

  const defaultRolePermissions: Record<string, string[]> = {
    admin: ['admin:all', 'projects:read', 'projects:write', 'commissions:approve', 'commissions:payout', 'database:manage', 'webhooks:manage', 'api_tokens:manage', 'audit_logs:read'],
    bd_head: ['admin:all', 'projects:read', 'projects:write', 'commissions:approve', 'commissions:payout', 'database:manage', 'webhooks:manage', 'api_tokens:manage', 'audit_logs:read'],
    sales: ['projects:read', 'projects:write', 'outreach:generate', 'inbox:manage', 'commissions:view_own', 'chat:write'],
    coordinator: ['projects:read', 'projects:write', 'discord:handoff', 'inbox:manage', 'chat:write'],
    developer: ['projects:read', 'staging:review', 'qa:signoff', 'discord:handoff', 'vault:read', 'chat:write'],
    client_guest: ['portal:access', 'milestones:review', 'staging:inspect', 'invoices:view', 'feedback:submit'],
    collaborator: ['projects:read_assigned', 'deals:evaluate', 'staging:inspect', 'feedback:submit', 'chat:write']
  };

  const newUser = {
    id: `user-${Date.now()}`,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash: hashPassword(data.password),
    role: data.role || 'sales',
    title: data.title || `${(data.role || 'sales').toUpperCase()} Member`,
    avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000000)}?w=150`,
    permissions: defaultRolePermissions[data.role] || defaultRolePermissions.sales,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  logAuditAction({
    userId: newUser.id,
    userName: newUser.name,
    userRole: newUser.role,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: newUser.id,
    details: { email: newUser.email, role: newUser.role, title: newUser.title },
    ipAddress: ipAddress || '127.0.0.1'
  });

  const token = signToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
    title: newUser.title,
    permissions: newUser.permissions
  });

  const sanitized = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    title: newUser.title,
    avatar: newUser.avatar,
    permissions: newUser.permissions
  };

  return {
    success: true,
    user: sanitized,
    token,
    message: 'User registered and authenticated successfully.'
  };
}
