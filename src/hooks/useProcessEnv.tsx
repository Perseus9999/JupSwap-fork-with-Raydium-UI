export default function useProcessEnv() {
  const env = process.env.NEXT_PUBLIC_NODE_ENV
  return { isDevelopMode: env === 'development', isProductionMode: env === 'production' }
}
