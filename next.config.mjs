/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ssh2 ships native bindings that webpack can't bundle; keep it (and the SFTP
  // client that wraps it) as a runtime require in server code.
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client'],
};

export default nextConfig;
