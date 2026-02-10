import { bascoin, currentNodeAddress } from '../lib/node_model.js'; //bascoin class importeren
import { broadcast } from '../functions/broadcast.js';
import { consensusREQ } from '../functions/consensus.js';

//Verzoek naar de vaste node om deel te nemen aan het netwerk
export async function startGossip(currentNode) {

    const fixedNode = 'http://localhost:3001';
    if (fixedNode === currentNode) return;

    try {
        const result = await fetchWithRetry(`${fixedNode}/gossip/register-and-broadcast-node`, {
            method: 'POST',
            body: JSON.stringify({ newNodeAddress: currentNode }),
            headers: { 'Content-Type': 'application/json' }
        }, 10, 1500); // Probeer 5 keer, wachttijd start bij 1.5s

        console.log(`Gossip gelukt: ${JSON.stringify(result)}`);
    } catch (error) {
        console.log(`Gossip mislukt, node is vervallen, run het nog een keer: ${error.message}`);
    };
};

//soms fetch problemen, wss doordat de node nog niet helemala is opgestart of bezig was met meerdere verzoeken tegelijkertijd.. deze function 'voorkomt' dat:
async function fetchWithRetry(url, options, maxRetries = 10, delayMs = 2000) {

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`Netwerk probleem: ${response.status}`);

            return await response.json(); // succes            
        } catch (err) {
            console.log(`Poging ${attempt} mislukt (${url}): ${err.message}`);
            if (attempt === maxRetries) throw err; // stop na maxRetries
            await new Promise(resolve => setTimeout(resolve, attempt * delayMs));
        };
    };
};

export async function registerAndBroadcastNewNode(req, res) {
    const { newNodeAddress } = req.body; //http://localhost:3002

    //(STAP 1). Controleren of deze node de 'nieuwe node' kent - mogelijk toevoegen 
    const result = bascoin.addNewNode(newNodeAddress); //retruneert success: true of false
    console.log(result);

    //(STAP 2). Nieuwe node Broadcasten naar de rest van de bekende nodes 
    if (bascoin.networkNodes.length >= 1) {
        const results = await broadcast(bascoin.networkNodes, "/gossip/register-node", { newNodeAddress });
        console.log(results);
    };

    //(STAP 3). Nieuwe node slaat de nodes op
    const allNetworkNodes = [currentNodeAddress, ...bascoin.networkNodes];
    try {
        const response = await fetch(`${newNodeAddress}/gossip/register-nodes-bulk`, {
            method: 'POST',
            body: JSON.stringify({ allNetworkNodes: allNetworkNodes }),
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        console.log(result);
        console.log(`**********GOSSIP AFGREOND**********`); // CLI overzicht

    } catch (error) {
        console.log(error);
    };

    //consensus - voor syncroniseren v.d. chain
    const results = await consensusREQ(allNetworkNodes);
    console.log(results);

    res.json({ msg: "Alles gelukt - Nieuwe node is gesynchroniseerd met het netwerk.", success: true });
};

export function registerNode(req, res) {
    const { newNodeAddress } = req.body;

    //Voorkomen dat de node zichzelf toevoegt aan zijn networkNodes[]
    if (newNodeAddress === currentNodeAddress) return res.json({ msg: "Node kan zichzelf niet registreren.", success: false });

    const result = bascoin.addNewNode(newNodeAddress); //retruneert success: true of false
    res.json(result)
};

export function registerNodesBulk(req, res) {
    const { allNetworkNodes } = req.body;

    allNetworkNodes.forEach((node) => { bascoin.addNewNode(node); });
    //Final netwerk: 
    console.log(allNetworkNodes);
    res.json({ msg: "Nieuwe node heeft ook alle nodes ogeslagen.", finalNetwerk: allNetworkNodes });
};