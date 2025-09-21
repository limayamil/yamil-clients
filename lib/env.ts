const requiredServerEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const requiredClientEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

type ServerEnv = typeof requiredServerEnv[number];
type ClientEnv = typeof requiredClientEnv[number];

export function getServerEnv(): Record<ServerEnv, string> {
  return requiredServerEnv.reduce((acc, key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required server env var ${key}`);
    }
    return { ...acc, [key]: value };
  }, {} as Record<ServerEnv, string>);
}

export function getClientEnv(): Record<ClientEnv, string> {
  return requiredClientEnv.reduce((acc, key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required client env var ${key}`);
    }
    return { ...acc, [key]: value };
  }, {} as Record<ClientEnv, string>);
}
