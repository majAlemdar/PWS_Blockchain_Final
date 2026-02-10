import {getBlockchain, getAddressData, getBlockByBlockHash, getTransactionByTxID} from '../controllers/blockExplorer.js'
import {Router} from 'express';
const router = Router();

//* Block explorer:
router.get('/blockchain', getBlockchain);
router.post('/address-data', getAddressData);
router.get('/block/:blockHash', getBlockByBlockHash);
router.get('/transaction/:txid', getTransactionByTxID);

export default router;