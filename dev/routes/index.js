import PoW_router from './PoW_route.js';
import consensus_router from './consensusRoute.js';
import gossip_router from './gossipRoute.js';
import blockExplorer_router from './blockExplorer_route.js';
import apiRoutes from './apiRoutes.js';
import transaction_router from './transaction_route.js';

export default function Routers(app) {
    app.use('/gossip', gossip_router);
    app.use('/api', apiRoutes);
    app.use('/explore', blockExplorer_router);
    app.use('/transaction', transaction_router);
    app.use('/PoW', PoW_router);
    app.use('/consensus', consensus_router);
    app.use((req, res) => { res.status(404).send('Pagina niet gevonden. Waarschijnlijk een foute endpoint.'); });
};