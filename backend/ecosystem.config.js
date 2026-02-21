module.exports = {
  apps: [
    {
      name: 'morren-backend',
      script: 'dist/index.js',
      cwd: '/opt/morren/backend',
      instances: 1,              // 1 vCPU droplet — no benefit from more
      exec_mode: 'fork',         // fork is lighter than cluster on single core
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      min_uptime: '10s',         // must stay up 10s to be considered stable
      max_restarts: 10,          // stop restarting after 10 crashes
      exp_backoff_restart_delay: 100, // exponential backoff between restarts (ms)
      listen_timeout: 8000,      // wait 8s for process to be ready before killing
      kill_timeout: 5000,        // give 5s for graceful shutdown
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
