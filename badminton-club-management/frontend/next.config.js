/*

// @type {import('next').NextConfig} 
const nextConfig = {
    reactStrictMode: true
  };
  
  module.exports = nextConfig;

*/

const path = require('path');

  const nextConfig = {
    compiler: {
      // optional but useful
      styledComponents: true,
    },
    webpack: (config) => {
      config.resolve.alias['@'] = path.resolve(__dirname);
      return config;
    },
    images: {
      domains: ['i.pravatar.cc'],
    },
  };
  



module.exports = nextConfig;