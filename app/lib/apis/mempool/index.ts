import { Network, networks } from "bitcoinjs-lib";

import AxiosInstance from "@/lib/axios";

const BaseUrl = (network: Network) =>
  network === networks.bitcoin
    ? "https://mempool.space/api"
    : "https://mempool.space/testnet/api";

export const getAddressBalance = async (address: string, network: Network) => {
  const { data } = await AxiosInstance.get<{
    address: string;
    chain_stats: {
      funded_txo_count: number;
      funded_txo_sum: number;
      spent_txo_count: number;
      spent_txo_sum: number;
      tx_count: number;
    };
    mempool_stats: {
      funded_txo_count: number;
      funded_txo_sum: number;
      spent_txo_count: number;
      spent_txo_sum: number;
      tx_count: number;
    };
  }>(`${BaseUrl(network)}/address/${address}`);

  const { chain_stats, mempool_stats } = data;

  const totalBalance =
    chain_stats.funded_txo_sum +
    mempool_stats.funded_txo_sum -
    chain_stats.spent_txo_sum -
    mempool_stats.spent_txo_sum;

  const confirmedBalance =
    chain_stats.funded_txo_sum - chain_stats.spent_txo_sum;

  return {
    totalBalance,
    confirmedBalance,
  };
};

export const getBtcPrice = async () => {
  const { data } = await AxiosInstance.get<{
    time: number;
    USD: number;
  }>("https://mempool.space/api/v1/prices");

  return data.USD;
};
