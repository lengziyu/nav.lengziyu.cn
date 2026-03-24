module.exports = {
  apps: [
    {
      name: "nav-lengziyu",
      cwd: "/opt/apps/nav.lengziyu.cn",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "800M",
      watch: false,
    },
  ],
};
