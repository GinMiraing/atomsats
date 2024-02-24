import { type Network, networks } from "bitcoinjs-lib";

import { ElectrumApi } from "./electrum-api";

const electrumClient = ElectrumApi.createClient(
  "https://ep.atomicals.xyz/proxy",
);

const testnetElectrumClient = ElectrumApi.createClient(
  "https://eptest.atomicalswallet.com/proxy",
);

export const getElectrumClient = (network: Network) =>
  network === networks.testnet ? testnetElectrumClient : electrumClient;
