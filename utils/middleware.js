import { verifyToken, getTokenFromRequest } from "./auth.js";

export function withAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    req.user = user;
    return handler(req, res);
  };
}

export function withRBACAuth(allowedRoles = []) {
  return (handler) => {
    return async (req, res) => {
      const token = getTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
      }

      const user = verifyToken(token);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      req.user = user;
      return handler(req, res);
    };
  };
}

// Backward-compatible alias used by older API routes
export const requireAuth = withAuth;
