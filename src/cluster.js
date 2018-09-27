const cluster = require('cluster');
const os = require('os');
const config = require('./config');

if (config.app.multicore) {
  if (cluster.isMaster) {
    const cpus = os.cpus().length;

    console.log(`Forking for ${cpus} CPUs`);
    for (let i = 0; i<cpus; i++) {
      cluster.fork();
    }
  } else {
    require('./index');
  }
} else {
  require('./index')
}

