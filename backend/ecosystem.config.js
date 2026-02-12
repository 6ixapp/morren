module.exports = {
  apps: [
    {
      name: 'morren-backend',
      script: 'dist/index.js',
      cwd: '/opt/morren/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/morren/error.log',
      out_file: '/var/log/morren/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
