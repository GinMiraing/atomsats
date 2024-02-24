import axios from "axios";

import { detectAddressTypeToScripthash } from "@/lib/utils/address-helpers";

import { ElectrumApiInterface } from "./electrum-api.interface";

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

        const response = await axios(options);
        return response.data.response;
      } catch (error) {
        console.log(`Error using endpoint ${baseUrl}:`, error);
      }
    }

    throw new Error("All endpoints failed");
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

  public atomicalsGet(atomicalAliasOrId: string | number): Promise<any> {
    return this.call("blockchain.atomicals.get", [atomicalAliasOrId]);
  }

  public atomicalsGetFtInfo(atomicalAliasOrId: string | number): Promise<any> {
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
  ): Promise<any> {
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

  public atomicalsGetTxHistory(
    atomicalAliasOrId: string | number,
  ): Promise<any> {
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
    result: {
      atomical_id: string;
      atomical_number: number;
      atomical_ref: string;
      confirmed: boolean;
      subtype: string;
      type: "NFT" | "FT";
      mint_data: {
        fields: {
          [key: string]: any;
        };
      };
      mint_info: {
        commit_height: 819238;
        commit_index: 0;
        commit_location: "0000e13a4012188a15950df1b61cfe7c41529a49032a13af55a686e572e755b5i0";
        commit_tx_num: 928495589;
        commit_txid: "0000e13a4012188a15950df1b61cfe7c41529a49032a13af55a686e572e755b5";
        reveal_location: "918f911add2a0bd9badea68a5bdd95328f18dfa7cdc0e15c54637c57a54e6c9ai0";
        reveal_location_blockhash: "39c0fc6107480286b8c9699c43803f789a69ee7058af02000000000000000000";
        reveal_location_header: "000000206f3010c5f1877a86ca8c344760b9c771dcfb809c073e000000000000000000004aae82afb0807dd6c54a81430db054044804bf089411db9d69a37a97bc97f6c9048c69655024041726504cf4";
        reveal_location_height: 819238;
        reveal_location_index: 0;
        reveal_location_script: "51202ec6022b88c089fda4cbb8fdd0198a205c5304318de68369140d34d2ddc85f2f";
        reveal_location_scripthash: "d6394a9c25e257cb7be3774fd68bd35193854351b4b4f074ae71cf99bcc20952";
        reveal_location_tx_num: 928495590;
        reveal_location_txid: "918f911add2a0bd9badea68a5bdd95328f18dfa7cdc0e15c54637c57a54e6c9a";
        reveal_location_value: 1000;
      };
      $bitwork: {
        bitworkc?: string;
        bitworkr?: string;
      };

      // dmint
      $parent_container: string;
      $parent_container_name: string;
      $request_dmitem: string;
      $dmitem: string;

      // realm
      $full_realm_name: string;
      $realm: string;
      $request_realm: string;

      // ft
      $max_mints: number;
      $max_supply: number;
      $mint_amount: number;
      $mint_bitworkc: string;
      $mint_bitworkr: string;
      $mint_height: number;
      $mint_mode: "fixed" | "perpetual";
      $request_ticker: string;
      $ticker: string;
      $mint_bitwork_vec: string;
      $mint_bitworkc_inc: number;
      $mint_bitworkc_start: number;
      $mint_bitworkr_inc: number;
      $mint_bitworkr_start: number;

      // container
      $container: string;
      $request_container: string;
    }[];
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

  public atomicalsByAddress(address: string): Promise<any> {
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

  public atomicalsGetByContainer(container: string): Promise<any> {
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
  ): Promise<any> {
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
