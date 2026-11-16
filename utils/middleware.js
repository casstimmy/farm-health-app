import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "./auth.js";

/**
 * Resolve the logged-in user for a request.
 *
 * The token only proves who the caller was at login. Role, locations and
 * whether the account is still active are read fresh from the database on every
 * request, so deactivating someone or changing their role takes effect at once
 * instead of when their 7-day token expires.
 */
async function authenticate(req) {
  const token = getTokenFromRequest(req);
  if (!token) return { status: 401, error: "Unauthorized: No token provided" };

  const decoded = verifyToken(token);
  if (!decoded?.id) return { status: 401, error: "Unauthorized: Invalid token" };

  await dbConnect();
  const user = await User.findById(decoded.id)
    .select("name email role location locations isActive")
    .lean();

  if (!user) return { status: 401, error: "Unauthorized: Account no longer exists" };
  if (user.isActive === false) {
    return { status: 401, error: "Unauthorized: Account is deactivated" };
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location ? user.location.toString() : null,
      locations: (user.locations || []).map((l) => l.toString()),
    },
  };
}

function rolesForMethod(policy, method) {
  if (!policy) return null;
  if (Array.isArray(policy)) return policy; // same roles for every method
  return policy[method] || policy.ALL || null;
}

/**
 * Protect an API route.
 *
 * @param handler  the route handler; receives req.user
 * @param policy   optional. Either an array of roles allowed for every method,
 *                 or a map per HTTP method, e.g.
 *                 { POST: MANAGE, PUT: MANAGE, DELETE: ADMIN }
 *                 Methods not listed only require a valid login.
 */
export function withAuth(handler, policy = null) {
  return async (req, res) => {
    let result;
    try {
      result = await authenticate(req);
    } catch (err) {
      console.error("Auth check failed:", err.message);
      return res.status(500).json({ error: "Could not verify your session. Please try again." });
    }

    if (!result.user) {
      return res.status(result.status).json({ error: result.error });
    }

    const allowed = rolesForMethod(policy, req.method);
    if (allowed && !allowed.includes(result.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    req.user = result.user;
    return handler(req, res);
  };
}

/**
 * Role-restricted route: withRBACAuth(["SuperAdmin", "Manager"])(handler)
 * An optional per-method policy can narrow individual methods further:
 * withRBACAuth(MANAGE, { DELETE: ADMIN })(handler)
 */
export function withRBACAuth(allowedRoles = [], methodPolicy = null) {
  return (handler) => {
    const guarded = async (req, res) => {
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
      return handler(req, res);
    };
    return withAuth(guarded, methodPolicy);
  };
}

// Backward-compatible alias used by older API routes
export const requireAuth = withAuth;
