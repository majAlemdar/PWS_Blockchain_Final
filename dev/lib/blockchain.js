import Transaction from './transaction.js';
import { wallet } from '../lib/node_model.js';
import crypto from 'crypto';
import fs from 'fs';

export default class Blockchain {

    static miningReward = 50;
    static coinBaseAddress = "00";

    constructor(currentNodeAddress) {
        this.chain = [];   //keten
        this.mempool = []; //waar transacties komen
        this.currentNodeAddress = currentNodeAddress; //komt van networkNode.js
        this.networkNodes = []; //p2p model

        this.createNewBlock(100, '0', '0'); //genisisBlock
    }

    createNewBlock(nonce, prevBlockHash, hash, transactions = this.mempool) {
        const newBlock = {
            index: this.chain.length,
            timestamp: Date.now(),
            transactions: transactions,
            nonce: nonce,
            hash: hash,
            prevBlockHash: prevBlockHash
        };

        this.updateWalletAmount(this.mempool); //coins 'uitbetalen'
        this.mempool = []; //mempool leeg maken
        this.chain.push(newBlock);

        return newBlock;
    };

    updateWalletAmount(transactions) {
        console.log(transactions);

        if (Array.isArray(transactions)) {
            //hele mempool 'uitbetalen':
            for (const transaction of transactions) {
                const { sender, recipient, amount } = transaction; //public key van recipient {Pem} en aant coins
                const senderWallet = wallet.getWalletByPublicKeyPEM(sender);
                senderWallet.amount -= amount;

                const recipientWallet = wallet.getWalletByPublicKeyPEM(recipient);
                recipientWallet.amount += amount;

                fs.writeFileSync(senderWallet.filePath, JSON.stringify(senderWallet, null, 2));
                fs.writeFileSync(recipientWallet.filePath, JSON.stringify(recipientWallet, null, 2));
                console.log('beide wallets updated, normaal');
            }
        } else {
            //coinbase transactie 'uitbetalen':
            const { recipient, amount } = transactions;

            const recipientWallet = wallet.getWalletByPublicKeyPEM(recipient);
            recipientWallet.amount += amount;

            fs.writeFileSync(recipientWallet.filePath, JSON.stringify(recipientWallet, null, 2));
            console.log('wallet updated, coinbase');
        }
    };

    createCoinBaseTransaction(recipientAddress) {
        //recipientAddress - public key in {pem}

        const transactionData = {
            sender: Blockchain.coinBaseAddress,
            recipient: recipientAddress,
            amount: Blockchain.miningReward,
            timestamp: Date.now(),
        };

        const txid = Transaction.generateTxID(transactionData);

        return {
            ...transactionData,
            txid
        };
    };

    //Transactie wordt extern gemaakt in transaction.js
    addTransactionToMempool(transaction) {
        this.mempool.push(transaction);
        return (this.getLastBlock().index + 1) //index van het blok waarin de nieuwe transactie zich zal bevinden
    };

    addNewNode(newNodeAddress) {
        //Controleren of deze node de 'nieuwe node' kent - mogelijk toevoegen 
        if (this.networkNodes.indexOf(newNodeAddress) == -1 && this.currentNodeAddress != newNodeAddress) {
            this.networkNodes.push(newNodeAddress);
            return { success: true, msg: "Nieuwe node opgeslagen" };

        } else return { success: false, msg: "Node is al aanwezig." };
    };

    getLastBlock() {
        return this.chain[this.chain.length - 1]; //laatste blok returneren
    };

    getTransaction(txid) {
        txid = txid.trim();
        for (const block of this.chain) {
            const transaction = block.transactions.find((transaction) => { return transaction.txid === txid });
            if (transaction && block) return { transaction, block };
        }
    };

    getBlock(blockHash) {
        blockHash = blockHash.trim();
        const block = this.chain.find((block) => block.hash === blockHash);
        return block;
    };

    getMempool(){
        return this.mempool;
    };

    hashBlock(prevBlockHash, currentBlockData, nonce) {
        const dataString = prevBlockHash + JSON.stringify(currentBlockData) + nonce.toString();
        const hash = crypto.createHash("sha256").update(dataString).digest("hex"); //hex
        return hash;
    };

    PoW(prevBlockHash, currentBlockData) {
        //juiste nonce vinden door PoW:
        //regel => 0000x
        let nonce = 0;
        let hash = this.hashBlock(prevBlockHash, currentBlockData, nonce);

        //nieuwe hash maken totdat het volgens de regels is:
        while (hash.substring(0, 4) !== "0000") {
            nonce++; //waarde van nonce veranderen 
            hash = this.hashBlock(prevBlockHash, currentBlockData, nonce);
        };
        return nonce; //hash is geldig, nonce returneren
    };

    //consensus
    chainIsValid(chain) {
        //chains vergelijken: hash (index, transactions) en PoW regel
        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const prevBlock = chain[i - 1];

            //hash controleren - "0000x"
            const currentBlockData = { index: currentBlock.index, transactions: currentBlock.transactions };
            console.log(currentBlock.transactions)
            const blockHash = this.hashBlock(prevBlock.hash, currentBlockData, currentBlock.nonce);
            console.log(blockHash);

            //foute hash of index:
            if (currentBlock.prevBlockHash != prevBlock.hash || blockHash.substring(0, 4) != "0000" || currentBlock.hash != blockHash) { 
                console.log('hash kl;opt niet'); 
                return false;
            };
        };

        //genisisBlock controleren
        const genisisBlock = chain[0];
        if (genisisBlock.nonce != 100 || genisisBlock.prevBlockHash != "0" || genisisBlock.hash != "0" || genisisBlock.transactions.length != 0) { 
            console.log('genisis klopt niet'); 
            return false; 
        };

        console.log('chain is valid ');
        return true;
    };
};
