module.exports = {
    apps: [
        {
            name: 'hgf',
            script: 'dist/index.js',
            exec_mode: 'cluster',
            instances: 0,
            watch: true,
            watch_delay: 1000,
            env: {
                env: "development",
            },
            env_production: {
                env: "production"
            }
        }
    ]
};