import { bascoin } from "../lib/node_model.js";
export async function consensusREQ(nodes) {

    const responses = nodes.map(async (node) => {
        try {
            const response = await fetch(`${node}/consensus`, { headers: { 'Content-Type': 'application/json' } });
            const result = await response.json();
            return result;

        } catch (error) {
            // console.log(error);

            if (error.cause?.code === "ECONNREFUSED") return { error: "offline", offline: true, node };
            return { node, success: false, error: error };
        };
    });

    const results = await Promise.allSettled(responses);
    return results;
};

export async function consensusInterval(nodes) {

    try {
        const result = await consensusREQ(nodes);

        const offlineNodes = result.map((res) => { return res.value })
            .filter((res) => { return res.offline == true; })
            .map((nodeAdr) => { return nodeAdr.node });

        offlineNodes.forEach((node) => {
            const index = bascoin.networkNodes.indexOf(node)
            if (index != -1) bascoin.networkNodes.splice(index, 1);
        });

        console.log("Consensus uitgevoerd");
    } catch (err) {
        console.log("Consensus error:", err);
    };
};
