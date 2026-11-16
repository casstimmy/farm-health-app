import mongoose from "mongoose";
import dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

const CONNECT_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,
};

// A mongodb+srv:// address needs a DNS SRV lookup. Some networks (phone
// hotspots, some routers) do not answer those, and the connection then fails
// before it ever reaches the database. These public resolvers are used only
// after such a failure — on a network where DNS works they are never touched.
const FALLBACK_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

function isSrvLookupFailure(err) {
  return err?.syscall === "querySrv" || err?.syscall === "queryTxt";
}

async function connect() {
  try {
    return await mongoose.connect(MONGODB_URI, CONNECT_OPTIONS);
  } catch (err) {
    if (!isSrvLookupFailure(err)) throw err;

    console.warn(
      `MongoDB: DNS lookup failed (${err.code}). Retrying with public DNS servers.`
    );
    dns.setServers(FALLBACK_DNS_SERVERS);
    return mongoose.connect(MONGODB_URI, CONNECT_OPTIONS);
  }
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connect().catch((err) => {
      // Forget the failed attempt so the next request retries, instead of
      // every later request awaiting the same rejected promise.
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
export const mongooseConnect = dbConnect;
