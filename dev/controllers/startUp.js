import { bascoin, wallet, currentNodeAddress } from "../lib/node_model.js";
import { startGossip } from "./gossipControllers.js";
import { consensusInterval } from "../functions/consensus.js";

export async function start() {

    wallet.resetUserWalletsOnStartup();     // wallets resetten bij startup
    wallet.createWallet();                  // zodra de node start, eerste wallet aanmaken
    // Verzoek naar de vaste node, zodat de nieuwe node het netwerk joint..
    await startGossip(currentNodeAddress);

    setInterval(async () => {
        if (bascoin.networkNodes.length >= 1) {
            const allNetworkNodes = [currentNodeAddress, ...bascoin.networkNodes];
            consensusInterval(allNetworkNodes);
        };
    }, 60000); // elke minuut
};