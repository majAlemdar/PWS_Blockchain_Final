import express from 'express';
import path from 'path';
import Routers from './routes/index.js';
import { fileURLToPath } from 'url';
import { start } from './controllers/startUp.js';
import { PORT } from './lib/node_model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// middlewares en public dir hosten:
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //voor form data
app.use(express.static(path.join(__dirname, 'public'))); //public dir static hosten

//routing en endpoints via:
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'blockchain.html')); });
Routers(app);

app.listen(PORT, async () => {
    console.log(`Luisteren naar localhost:${PORT}`);
    await start();
});