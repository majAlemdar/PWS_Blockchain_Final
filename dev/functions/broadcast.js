//Broadcasting newNodeAddress, blocks or transactions:
export async function broadcast(peers, url, data) {

    const reqests = peers.map(async (node) => {
        try {
            const response = await fetch(`${node}${url}`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            return { node, result }; //status: "fullfilled"; value

        } catch (error) {
            return { node, error }; //status: "rejected"; reason
        };
    });

    const results = await Promise.allSettled(reqests);
    return results
};