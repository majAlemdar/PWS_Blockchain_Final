import { bascoin, currentNodeAddress } from '../lib/node_model.js'; //bascoin class importeren

export async function consensus(req, res) {

    if (bascoin.networkNodes.length < 1) return;

    const blockchainResponses = bascoin.networkNodes.map(async (node) => {
        try {
            const response = await fetch(`${node}/explore/blockchain`, { headers: { 'Content-Type': 'application/json' } });
            const blockchain = await response.json();
            return { blockchain, success: true };
        } catch (error) {
            // console.log(error);
            return { node, success: false, error: error };
        };
    });
    const blockchainResults = await Promise.allSettled(blockchainResponses);

    const blockchains = blockchainResults
        .filter(result => result.status === "fulfilled" && result.value.success === true)
        .map(result => result.value.blockchain); // alleen de chain zelf

    // console.log(blockchains[0].chain);
    //huidige waarden:
    const currentChainLength = bascoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newMempool = null;

    if (bascoin.chain.length === 1) {
        for (const blockchain of blockchains) {

            //andere chain - alleen genesis block, dus we kijken naar timestamp
            if (blockchain.chain.length === 1) {
                const currentGenesisTimestamp = bascoin.chain[0].timestamp;
                const otherGenesisTimestamp = blockchain.chain[0].timestamp;

                // Kies de chain met de oudste timestamp (hoe ouder, hoe kleiner de waarde)
                if ((otherGenesisTimestamp < currentGenesisTimestamp) && bascoin.chainIsValid(blockchain.chain)) {
                    maxChainLength = blockchain.chain.length;
                    newMempool = blockchain.mempool;
                    newLongestChain = blockchain.chain;
                };

            } else if (blockchain.chain.length > currentChainLength && bascoin.chainIsValid(blockchain.chain)) {
                maxChainLength = blockchain.chain.length;
                newMempool = blockchain.mempool;
                newLongestChain = blockchain.chain;
            };
        };

    } else {
        // Als er meerdere blokken zijn, kies de langste chain
        for (const blockchain of blockchains) {
            if (blockchain.chain.length > currentChainLength && bascoin.chainIsValid(blockchain.chain)) {
                maxChainLength = blockchain.chain.length;
                newMempool = blockchain.mempool;
                newLongestChain = blockchain.chain;
            };
        };
    };

    if (newLongestChain) {
        bascoin.chain = newLongestChain;
        bascoin.mempool = newMempool;
        res.json({ msg: "Oude chain is vervangen door een langere chain.", chain: bascoin.chain, success: true});
        // console.log("Oude chain is vervangen door een langere chain.");
    } else res.json({ msg: "Chain is niet vervangen.", chain: bascoin.chain, success: false });
}