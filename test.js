const pm2 = require('pm2');

pm2.list(function(err, pm2Processes) {
    pm2Processes.filter(function(pm2Process){
        if (pm2Process.pid === process.pid) {
            pm2.restart(pm2Process);
        }
    });
});
