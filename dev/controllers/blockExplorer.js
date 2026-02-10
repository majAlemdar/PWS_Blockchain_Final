import { bascoin, wallet } from '../lib/node_model.js';

export function getBlockchain(req, res) { res.json(bascoin); };

export function getAddressData(req, res) {
    const { publicKey } = req.body; //{base64}
    console.log(publicKey);

    const userWallet = wallet.getWalletByPublicKeyBase64(publicKey);
    if (!userWallet) return res.status(500).json({ msg: 'Reload.', success: false });

    res.json({userWallet, success: true});
}

export function getBlockByBlockHash(req, res){
    const { blockHash } = req.params;
    if (!blockHash) return res.status(400).json({ msg: 'Gegeven waarde klopt niet' })

    const block = bascoin.getBlock(blockHash);
    if (!block) return res.status(404).json({ msg: `Block met hash ${blockHash} bestaat niet.`, block: null });

    res.json({ block: block });
}

export function getTransactionByTxID(req, res){
    const { txid } = req.params;
    const { transaction, block } = bascoin.getTransaction(txid);

    if (!transaction || !block) return res.status(404).json({ msg: `Transaction met ${txid} bestaat niet.` });
    res.json({transaction, block});
}