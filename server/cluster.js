const cluster = require("cluster");
const http = require("http");
const { setupMaster } = require("@socket.io/sticky");
require('dotenv').config()

const WORKERS_COUNT = process.env.WORKERS_COUNT
const PORT = process.env.SOCKET_PORT

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < WORKERS_COUNT; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });

  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });

  httpServer.listen(PORT, () =>
    console.log(`server listening at http://localhost:${PORT}`)
  );
} else {
  console.log(`Worker ${process.pid} started`);
  require("./index");
}
