const net = require('net');
const readline = require('readline');

class TextBuffer {
  constructor(text) {
    this.content = text;
  }

  get() {
    return this.content;
  }

  add(text) {
    this.content += `\n${text}`
  }

  flush() {
    this.content = '';
  }
}

class Client {
  constructor(socket, id) {
    this.socketObject = socket;
    this.id = id;
    this.username = "";
    this.hostname = "";
    this.initalized = false;
  }

  establish(username, hostname) {
    this.username = username;
    this.hostname = hostname;
    this.initalized = true;
  }
  
  
}

function updateMap() {
  for (const client of clients) {
    clientIdMap[client] = client.id;
    idClientMap[client.id] = client;
    socketIdMap[client.socketObject] = client.id;
  }
}

const idClientMap = {};
const clientIdMap = {};
const socketIdMap = {};
let clients = [];
let currentId;

const textBuffer = new TextBuffer('');

const server = net.createServer((socket) => {
  const id = Math.random().toString(36).substring(7);
  clients[id] = {socketObject: socket, hostname: socket.remoteAddress};
  let newClient = new Client(socket, id);
  clients.push(newClient);
  updateMap();

socket.on('data', (data) => {
  const parsedData = JSON.parse(data);

  switch (parsedData['type']) {
    case 'response':
      textBuffer.add(parsedData['data']);
      break;
    case 'establishment':
      const client = idClientMap[socketIdMap[socket]];
      try {
      const { username, hostname } = parsedData.data;
	client.establish(username, hostname);
      } catch (err) {
        textBuffer.add("ERROR ESTABLISHING CLIENT: \n " + err);
      }
  }
});

socket.on('end', () => {
  delete clients[id];
  textBuffer.add(`Client ${id} disconnected`);
});


});

server.listen(8080, () =>
	{
});

function exit(message = "shutting down Shrimp server.) {
  process.stdout.write(message);
  process.exit(1);

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
 console.log('Hello!');
 while (true) {
   let input = await promptUser("shrimp! >>");
   switch (input.split(" ")[0]) {
     case "set":
       const id = input.split(" ")[1];
       currentId = id;
       while (currentId != ""){
         const command = await promptUser(idClientMap[currentId].hostname+'$ ');
	 if (command == "!exit") {
	   currentId = "";
	   break;
	 } 
         idClientMap[currentId].socketObject.write(command);
         // Create a promise that resolves after 10 seconds
         const timeoutPromise = new Promise(resolve => setTimeout(resolve, 10000));

         // Create a promise that resolves when the output arrives
         const outputPromise = new Promise(resolve => {
           const intervalId = setInterval(() => {
             if (textBuffer.get() != "") {
               clearInterval(intervalId);
               resolve();
             }
           }, 100);
         });

         // Wait for either the timeout or the output to arrive
         await Promise.race([timeoutPromise, outputPromise]);

         // If the output arrived, print it
         if (textBuffer.get() != "") {
           console.log(textBuffer.get());
           textBuffer.flush();
         }
       }
       
       break;

     case "list":
       for (let client of clients) {
         console.log(`${client.id}: ${client.username}@${client.hostname}`);
       }
       break;
     case "clear":
       console.log('\033[2J');
     default:
       exit();
       break;
   }
 }
}
