const backendOrigin = String(process.env.BACKEND_ORIGIN || '').replace(/\/$/, '')

if (!/^https:\/\/[^/]+$/.test(backendOrigin)) {
  throw new Error('BACKEND_ORIGIN must be the HTTPS origin of the Render API service')
}

export const config = {
  framework: 'vite',
  rewrites: [
    { source: '/api/:path*', destination: `${backendOrigin}/api/:path*` },
    { source: '/socket.io/:path*', destination: `${backendOrigin}/socket.io/:path*` },
    { source: '/(.*)', destination: '/index.html' },
  ],
}
