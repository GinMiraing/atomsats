import AxiosInstance from "@/lib/axios";
import { detectAddressTypeToScripthash } from "@/lib/utils/address-helpers";

import { ElectrumApiInterface } from "./electrum-api.interface";
import { AtomicalUnionResponse, FTResponse } from "./type";

export class ElectrumApi implements ElectrumApiInterface {
  private isOpenFlag = false;
  private endpoints: string[] = [];

  private constructor(
    private baseUrl: string,
    private usePost = true,
  ) {
    this.initEndpoints(baseUrl);
    this.resetConnection();
  }

  private initEndpoints(baseUrl: string) {
    this.endpoints = baseUrl.split(",");
  }

  public async resetConnection() {
    this.isOpenFlag = false;
  }

  static createClient(url: string, usePost = true) {
    return new ElectrumApi(url, usePost);
  }

  public async open(): Promise<any> {
    return new Promise((resolve) => {
      if (this.isOpenFlag) {
        resolve(true);
        return;
      }
      this.isOpenFlag = true;
      resolve(true);
    });
  }

  public isOpen(): boolean {
    return this.isOpenFlag;
  }

  public async close(): Promise<any> {
    this.isOpenFlag = false;
    return Promise.resolve(true);
  }

  public async call(method: string, params: any) {
    for (const baseUrl of this.endpoints) {
      try {
        const url = `${baseUrl}/${method}`;
        const options = {
          method: this.usePost ? "post" : "get",
          url: url,
          ...(this.usePost ? { data: { params } } : { params: params }),
        };

        const response = await AxiosInstance(options);
        return response.data.response;
      } catch (error) {
        console.log(`Error using endpoint ${baseUrl}:`, error);
        throw error;
      }
    }
  }

  public sendTransaction(signedRawTx: string): Promise<any> {
    return this.broadcast(signedRawTx);
  }

  public getTx(txId: string, verbose = false): Promise<any> {
    return new Promise((resolve, reject) => {
      this.call("blockchain.transaction.get", [txId, verbose ? 1 : 0])
        .then((result: any) => {
          resolve({ success: true, tx: result });
        })
        .catch((error) => reject(error));
    });
  }

  public async estimateFee(blocks = 1) {
    const p = new Promise((resolve, reject) => {
      this.call("blockchain.estimatefee", [blocks])
        .then(function (result: any) {
          resolve({
            success: true,
            result,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
    return p;
  }

  public serverVersion(): Promise<any> {
    return this.call("server.version", []);
  }

  public broadcast(rawtx: string, force = false): Promise<any> {
    return this.call(
      force
        ? "blockchain.transaction.broadcast_force"
        : "blockchain.transaction.broadcast",
      [rawtx],
    );
  }

  public dump(): Promise<any> {
    return this.call("blockchain.atomicals.dump", []);
  }

  public atomicalsGetGlobal(hashes: number): Promise<any> {
    return this.call("blockchain.atomicals.get_global", [hashes]);
  }

  public atomicalsGet(atomicalAliasOrId: string | number): Promise<{
    result: AtomicalUnionResponse;
  }> {
    return this.call("blockchain.atomicals.get", [atomicalAliasOrId]);
  }

  public atomicalsGetFtInfo(atomicalAliasOrId: string | number): Promise<{
    result: FTResponse;
  }> {
    return this.call("blockchain.atomicals.get_ft_info", [atomicalAliasOrId]);
  }

  public atomicalsGetLocation(
    atomicalAliasOrId: string | number,
  ): Promise<any> {
    return this.call("blockchain.atomicals.get_location", [atomicalAliasOrId]);
  }

  public atomicalsGetStateHistory(
    atomicalAliasOrId: string | number,
  ): Promise<any> {
    return this.call("blockchain.atomicals.get_state_history", [
      atomicalAliasOrId,
    ]);
  }

  public atomicalsGetState(
    atomicalAliasOrId: string | number,
    verbose: boolean,
  ): Promise<{
    global: {
      atomical_count: number;
    };
    result: AtomicalUnionResponse;
  }> {
    return this.call("blockchain.atomicals.get_state", [
      atomicalAliasOrId,
      verbose ? 1 : 0,
    ]);
  }

  public atomicalsGetEventHistory(
    atomicalAliasOrId: string | number,
  ): Promise<any> {
    return this.call("blockchain.atomicals.get_events", [atomicalAliasOrId]);
  }

  public atomicalsGetTxHistory(atomicalAliasOrId: string | number): Promise<{
    result: {
      tx: {
        history: {
          height: number;
          tx_hash: string;
        }[];
      };
    };
  }> {
    return this.call("blockchain.atomicals.get_tx_history", [
      atomicalAliasOrId,
    ]);
  }

  public history(scripthash: string): Promise<any> {
    return this.call("blockchain.scripthash.get_history", [scripthash]);
  }

  public atomicalsList(
    limit: number,
    offset: number,
    asc = false,
  ): Promise<{
    result: AtomicalUnionResponse[];
  }> {
    return this.call("blockchain.atomicals.list", [limit, offset, asc ? 1 : 0]);
  }

  public atomicalsByScripthash(
    scripthash: string,
    verbose = true,
  ): Promise<any> {
    const params: any[] = [scripthash];
    if (verbose) {
      params.push(true);
    }
    return this.call("blockchain.atomicals.listscripthash", params);
  }

  public atomicalsByAddress(address: string): Promise<{
    atomicals: {
      [atomical: string]: {
        atomical_id: string;
        atomical_number: number;
        confirmed: number;
        subtype: string;
        type: "NFT" | "FT";
        data: {
          mint_data: {
            fields: {
              [key: string]: any;
            };
          };
        };

        // dmint
        dmitem: string;
        parent_container: string;
        request_dmitem: string;

        // FT
        request_ticker: string;
        ticker: string;

        // realm
        full_realm_name: string;
        realm: string;
        request_realm: string;

        // container
        container: string;
        request_container: string;
      };
    };
  }> {
    const { scripthash } = detectAddressTypeToScripthash(address);
    return this.atomicalsByScripthash(scripthash);
  }

  public atomicalsAtLocation(location: string): Promise<any> {
    return this.call("blockchain.atomicals.at_location", [location]);
  }

  public txs(txs: string[], verbose: boolean): Promise<any> {
    return Promise.all(
      txs.map((tx) =>
        this.call("blockchain.transaction.get", [tx, verbose ? 1 : 0]),
      ),
    );
  }

  public atomicalsGetRealmInfo(
    realmOrSubRealm: string,
    verbose?: boolean,
  ): Promise<any> {
    return this.call("blockchain.atomicals.get_realm_info", [
      realmOrSubRealm,
      verbose ? 1 : 0,
    ]);
  }

  public atomicalsGetByRealm(realm: string): Promise<any> {
    return this.call("blockchain.atomicals.get_by_realm", [realm]);
  }

  public atomicalsGetByTicker(ticker: string): Promise<any> {
    return this.call("blockchain.atomicals.get_by_ticker", [ticker]);
  }

  public atomicalsGetByContainer(container: string): Promise<{
    result: {
      status: string;
      candidate_atomical_id: string;
      atomical_id: string;
    };
  }> {
    return this.call("blockchain.atomicals.get_by_container", [container]);
  }

  public atomicalsGetContainerItems(
    container: string,
    limit: number,
    offset: number,
  ): Promise<any> {
    return this.call("blockchain.atomicals.get_container_items", [
      container,
      limit,
      offset,
    ]);
  }

  public atomicalsGetByContainerItem(
    container: string,
    itemName: string,
  ): Promise<any> {
    return this.call("blockchain.atomicals.get_by_container_item", [
      container,
      itemName,
    ]);
  }

  public atomicalsGetByContainerItemValidated(
    container: string,
    item: string,
    bitworkc: string,
    bitworkr: string,
    main: string,
    mainHash: string,
    proof: any,
    checkWithoutSealed: boolean,
  ): Promise<any> {
    return this.call("blockchain.atomicals.get_by_container_item_validate", [
      container,
      item,
      bitworkc,
      bitworkr,
      main,
      mainHash,
      proof,
      checkWithoutSealed,
    ]);
  }

  public atomicalsFindTickers(
    prefix: string | null,
    asc?: boolean,
  ): Promise<{
    result: {
      atomical_id: string;
      tx_num: number;
      ticker: string;
      ticker_hex: string;
    }[];
  }> {
    const args: any = [];
    args.push(prefix ? prefix : null);
    if (!asc) {
      args.push(1);
    } else {
      args.push(0);
    }
    return this.call("blockchain.atomicals.find_tickers", args);
  }

  public atomicalsFindContainers(
    prefix: string | null,
    asc?: boolean,
  ): Promise<any> {
    const args: any = [];
    args.push(prefix ? prefix : null);
    if (!asc) {
      args.push(1);
    } else {
      args.push(0);
    }
    return this.call("blockchain.atomicals.find_containers", args);
  }

  public atomicalsFindRealms(
    prefix: string | null,
    asc?: boolean,
  ): Promise<any> {
    const args: any = [];
    args.push(prefix ? prefix : null);
    if (!asc) {
      args.push(1);
    } else {
      args.push(0);
    }
    return this.call("blockchain.atomicals.find_realms", args);
  }

  public atomicalsFindSubRealms(
    parentRealmId: string,
    prefix: string | null,
    asc?: boolean,
  ): Promise<any> {
    const args: any = [];
    args.push(prefix ? prefix : null);
    if (!asc) {
      args.push(1);
    } else {
      args.push(0);
    }
    return this.call("blockchain.atomicals.find_subrealms", [
      parentRealmId,
      args,
    ]);
  }
}
