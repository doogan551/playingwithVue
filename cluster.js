{
    "apps": [{
        // Application #1
        "name": "infoscan",
        "script": "app.js",
        "watch": ["socket", "controllers", "models", "helpers"],
        "ignore_watch": ["logs", "apps", "build","nbproject", "scripts", "tests", "tmp"],
        "node_args": "--harmony",
        "merge_logs": true,
        "env": {
            "NODE_ENV": "localhost"
        },
        "exec_mode": "cluster",
        "instances": 0
    }]
}