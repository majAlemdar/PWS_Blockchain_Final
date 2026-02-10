import {mineBlock, receiveNewBlock} from '../controllers/PoWController.js';
import { Router } from 'express';
const router = Router();

//http://localhost:3001/PoW/mine
//BIJ DE EERSTE NODE:
router.post('/mine', mineBlock);
//TIJDENS BROADCASTEN:
router.post('/receive-new-block', receiveNewBlock);

export default router;