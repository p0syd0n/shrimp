import net from 'net';
import readline from 'readline';
import express from 'express';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

// class for text buffer, manages output during shell sessions
class TextBuffer {
        constructor() {
                this.content = "";
        }

        get() {
                return this.content;
        }

        add(text) {
		
                this.content += `${text}\n`;
        }

        flush() {
                this.content = '';
        }
}

class InfoBuffer extends TextBuffer {
	add(text) {
		if (text.toLowerCase().includes("error")) {
			this.content += chalk.hex(errorInfoBufferColor).bold(text + '\n')
		} else {
			this.content += chalk.hex(infoBufferColor)(text + '\n')
		}
	}
}

class OutputBuffer extends TextBuffer {
	add(text) {
		this.content += chalk.hex(outputBufferColor)(text);
	}
}

// client class
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

/*
 * updates the maps so that sockets, ids, and client objects can
 * be derived from each other.
 */
function updateMaps() {
        for (const client of clients) {
                clientIdMap[client] = client.id;
                idClientMap[client.id] = client;
                socketIdMap[client.socketObject] = client.id;
        }
}


function log(content) {
  // Use the 'a' flag to append to the file and create it if it doesn't exist
  fs.writeFile(logFile, content + '\n', { flag: 'a' }, (err) => {
    if (err) {
      infoBuffer.add('Error logging: ', err);
      return;
    }
  });
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'config.yaml');
const rawData = fs.readFileSync(configPath, 'utf8');
const config = yaml.load(rawData);

// Assigning values from the config object
const {
	ports: 
	{
  		fileServePort,
  		webSocketPort,
	},
  	other: 
	{
		shrimpPrompt, 
		defaultModuleToServe, 
		logFile, 
		modulesFolder,
		helpText,
	},
	colors:
	{	
		shrimpShellColor,
		helpTextColor,
    		errorFunctionColor,
    		errorInfoBufferColor,
    		infoBufferColor,
    		outputBufferColor,
    		shellColor,
    		clientsColorId,
    		clientsColorUsername,
    		clientsColorHostname,
  	}
} = config;

// defining maps and constants
const idClientMap = {};
const clientIdMap = {};
const socketIdMap = {};
var clients = [];
var moduleToServe = defaultModuleToServe;
let currentId;
const outputBuffer = new OutputBuffer();
const infoBuffer = new InfoBuffer();

const app = express();


app.get('/file', (req, res) => {
	log(`${process.cwd()}/${modulesFolder}/${moduleToServe}.py`)
	fs.readFile(`${process.cwd()}/${modulesFolder}/${moduleToServe}.py`, 'utf8', (err, data) => {
		if (err) {
    			infoBuffer.add('Error reading module ' + moduleToServe + 'to serve: ' + err);
    			return;
  		}
  		res.send(data);
	});
});

const server = net.createServer((socket) => {
	const id = Math.random().toString(36).substring(7);
	let newClient = new Client(socket, id);
	clients.push(newClient);
	updateMaps();

	let fullData = '';

	socket.on('data', (chunk) => {
		fullData += chunk.toString();

		if (fullData.endsWith('}')) {
			try {
				const parsedData = JSON.parse(fullData);
				const client = idClientMap[socketIdMap[socket]];

				switch (parsedData['type']) {
					case 'response':
						outputBuffer.add(parsedData.data);
						break;
				case 'response_module':
					log(parsedData.data);
					infoBuffer.add(`${client.username}@${client.hostname} has module output which has also been logged: \n ${parsedData.data}`);
					break;
				case 'establishment':
					try {
						const { username, hostname } = parsedData.data;
						client.establish(username, hostname);
					} catch (err) {
						infoBuffer.add("ERROR ESTABLISHING CLIENT: \n " + err);
					}
					break;							                
				}

				fullData = '';
			} catch (error) {
				console.error('Failed to parse JSON data:', error);
			}
		}
	});

	socket.on('end', () => {
		clients = clients.filter(client => client !== newClient);
		currentId = "";
		infoBuffer.add(`Client ${newClient.id} disconnected`);
	});
});

server.listen(webSocketPort, () => { });
app.listen(fileServePort, () => { });

function exit(message = "shutting down Shrimp server.") {
        process.stdout.write(message+'\n');
        process.exit(1);
}

function error(text) {
	console.log(chalk.hex(errorFunctionColor).bold(text))
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
                let input = await promptUser(chalk.hex(shrimpShellColor).bold(shrimpPrompt));
	
                switch (input.split(" ")[0]) {
                        case "set":
                                const id = input.split(" ")[1];
				if (!idClientMap[id]) {
					error(`No such client \"${id}\"`);
					break;
				}
                                currentId = id;
                                while (currentId != "") {
					try {
						var command = await promptUser(chalk.hex(shellColor).bold(idClientMap[currentId].hostname + '$ '));	
					} catch {
						break;

					}
                                        if (command == "!exit") {
                                                currentId = "";
                                                break;
                                        }

					switch (command.split(" ")[0]) {
						case "!exit":
							currentId = "";
							break;
							break;
						case "!module":
							if (command.split(" ").length == 1) {
								error("No module specified. Defaulting to: " + moduleToServe);
							} else {
								moduleToServe = command.split(" ")[1];
							}

							command = "!module";
							break;
					}
					try {
						idClientMap[currentId].socketObject.write(command);
					} catch {
						error("Error: most likely the client has disconnected.");
						break;
					}

                                        // Create a promise that resolves after 10 seconds
                                        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 10000));

                                        // Create a promise that resolves when the output arrives
                                        const outputPromise = new Promise(resolve => {
                             const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);                   const intervalId = setInterval(() => {
                                                        if (outputBuffer.get() != "") {
                                                                clearInterval(intervalId);
                                                                resolve();
                                                        }
                                                }, 100);
                                        });

                                        // Wait for either the timeout or the output to arrive
                                        await Promise.race([timeoutPromise, outputPromise]);

                                        // If the output arrived, print it
                                        if (outputBuffer.get().trim() != "") {
                                                console.log(outputBuffer.get());
                                                if (infoBuffer.get().trim() != "") {
                                                        console.log("INFO:\n" + infoBuffer.get());
                                                        infoBuffer.flush();
                                                }
                                                outputBuffer.flush();
                                        }
                                }

                                break;

                        case "list":
                                for (let client of clients) {
                                        console.log(`${chalk.hex(clientsColorId).bold(client.id)}: ${chalk.hex(clientsColorUsername)(client.username)}@${chalk.hex(clientsColorHostname)(client.hostname)}`);
                                }
                                break;

                        case "clear":
                                console.log('clear is broken');
				break;

			case "exit":
				exit();
				break;

			case "help":
				console.log(chalk.hex(helpTextColor)(helpText));
				break;

			default:
                                console.log('No such command');
				break;
                }
        }
}

main();

