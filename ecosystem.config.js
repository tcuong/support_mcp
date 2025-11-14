module.exports = {
    apps: [
      {
        name: 'wrangler-prod',
        cwd: 'D:/workspace/support_mcp',
        script: 'node_modules/.bin/wrangler',
        args: 'dev --env production --local',
        interpreter: 'none',
        exec_mode: 'fork',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        error_file: 'D:/workspace/support_mcp/logs/wrangler-error.log',
        out_file: 'D:/workspace/support_mcp/logs/wrangler-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
      }
    ]
  }
  