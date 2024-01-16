import { fileURLToPath } from 'url';
import path from 'path';

import express from 'express';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(__dirname));
app.listen(8079, () => console.log('Server started'));

