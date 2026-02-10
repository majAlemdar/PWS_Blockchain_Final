import { bascoin, wallet } from '../lib/node_model.js';
import { broadcast } from '../functions/broadcast.js';

//MINE EN BROADCAST NIEUWE BLOK
export async function mineBlock(req, res) {
    const { miner } = req.body //public key vd geselecteerde user {base64}

    const walletMiner = wallet.getWalletByPublicKeyBase64(miner);
    console.log(walletMiner)
    if (!walletMiner) return res.status(400).json({ msg: "Reload.", success: false }); //wss een wijziging dus herladen..

    const minerPublicKeyPem = walletMiner.publicKeyPem;

    const prevBlockHash = bascoin.getLastBlock().hash;
    //beloning voor het minen: coinbase wordt niet in mempool toegevoegd...
    const miningRewardTransaction = bascoin.createCoinBaseTransaction(minerPublicKeyPem);

    const currentBlockData = {
        index: bascoin.getLastBlock().index + 1,
        transactions: [miningRewardTransaction, ...bascoin.mempool]
    };
    const nonce = bascoin.PoW(prevBlockHash, currentBlockData);
    const hash = bascoin.hashBlock(prevBlockHash, currentBlockData, nonce); //blockheader
    const transactions = [miningRewardTransaction, ...bascoin.mempool];
    const newBlock = bascoin.createNewBlock(nonce, prevBlockHash, hash, transactions);

    bascoin.updateWalletAmount(miningRewardTransaction);

    //Block broadcasten: 
    if (bascoin.networkNodes.length >= 1) {
        const results = await broadcast(bascoin.networkNodes, "/PoW/receive-new-block", { newBlock });
        console.log(results);
    };

    //Alles gelukt:
    res.json({ msg: 'Nieuwe block is succesvol mined en mogelijk broadcasted.', success: true, newBlock: newBlock });
};

export function receiveNewBlock(req, res) {
    //controleren of het blok geldig is:
    const { newBlock } = req.body;
    const lastBlock = bascoin.getLastBlock();

    //correcte hash en index
    if (newBlock.prevBlockHash === lastBlock.hash && newBlock.index === lastBlock.index + 1) {
        bascoin.chain.push(newBlock);
        bascoin.mempool = []; //mempool leeg maken

        res.json({ msg: "Nieuwe blok received en geaccepteerd", newBlock: newBlock });
    } else res.json({ msg: "Nieuwe blok geweigert", newBlock: newBlock });
};