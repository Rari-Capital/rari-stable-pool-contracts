const ganache = require("ganache-core");
require('dotenv').config();
const server = ganache.server({ fork: process.env.DEVELOPMENT_WEB3_PROVIDER_URL_TO_BE_FORKED, gasLimit: 12.5e6, gasPrice: 1e6, unlocked_accounts: ["0x45D54B22582c79c8Fb8f4c4F2663ef54944f397a", "0x1Eeb75CFad36EDb6C996f7809f30952B0CA0B5B9", "0x10dB6Bce3F2AE1589ec91A872213DAE59697967a"], logger: console });
server.listen(8546);
