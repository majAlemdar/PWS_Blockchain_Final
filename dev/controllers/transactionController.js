import Transaction from '../lib/transaction.js';
import { bascoin, wallet } from '../lib/node_model.js';
import { broadcast } from '../functions/broadcast.js'


export async function createAndBroadCastTransaction(req, res) {
    const { senderPublicKeyBase64, recipientPublicKeyBase64, amount } = req.body;

    //wallets nemen, zodat we de pem format krijgen
    const { publicKeyPem: senderPublicKeyPem, privateKeyPem: senderPrivateKeyPem } = wallet.getWalletByPublicKeyBase64(senderPublicKeyBase64);
    const { publicKeyPem: recipientPublicKeyPem } = wallet.getWalletByPublicKeyBase64(recipientPublicKeyBase64);

    // tx met unieke handtekening
    const newTransaction = Transaction.createSignedTransaction(senderPublicKeyPem, senderPrivateKeyPem, recipientPublicKeyPem, amount);
    console.log(newTransaction);

    // verificatie voor de handtekening
    const isValid = Transaction.verifyTransaction(newTransaction, senderPublicKeyPem);
    if (!isValid) return res.status(400).json({ msg: "Ongeldige handtekening (de keys komen niet overeen). Transactie is geweigerd." });
    console.log('succesvol geverifieerd');

    // tx toevoegen aan de mempool
    bascoin.addTransactionToMempool(newTransaction);

    //Tx broadcasten:
    if (bascoin.networkNodes.length >= 1) {
        const results = await broadcast(bascoin.networkNodes, "/transaction/process-transaction", { newTransaction, senderPublicKeyPem });
        console.log(results);

        return res.json({ msg: "Tx is aangemaakt, geverifieerd, toegevoegd aan de mempool en broadcasted naar het hele netwerk. Zie blockchain mempool voor meer info.", success: true, newTransaction, results });
    }

    return res.json({ msg: 'Tx is gemaakt en toegevoegd aan de mempool.', newTransaction });
};

export function processTransaction(req, res) {
    const { newTransaction, senderPublicKeyPem } = req.body;
    // console.log('Tx is binnengekomen:' + newTransaction);

    //elk node controleert de handtekening
    const isValid = Transaction.verifyTransaction(newTransaction, senderPublicKeyPem);
    if (!isValid) return res.status(400).json({ msg: "Ongeldige transactie. Signature verification failed." });

    const nextBlockIndex = bascoin.addTransactionToMempool(newTransaction);
    res.json({ msg: `Tx ontvangen. Zal in blok ${nextBlockIndex} worden opgenomen.` });
}