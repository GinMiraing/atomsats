import ecc from "@bitcoinerlab/secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import * as bs58check from "bs58check";
import { sha256 } from "js-sha256";

bitcoin.initEccLib(ecc);

export function detectAddressTypeToScripthash(address: string): {
  output: string;
  scripthash: string;
  address: string;
} {
  // Detect legacy address
  try {
    bitcoin.address.fromBase58Check(address);
    const p2pkh = addressToP2PKH(address);
    const p2pkhBuf = Buffer.from(p2pkh, "hex");
    return {
      output: p2pkh,
      scripthash: Buffer.from(sha256(p2pkhBuf), "hex")
        .reverse()
        .toString("hex"),
      address,
    };
  } catch (err) {}
  // Detect segwit or taproot
  // const detected = bitcoin.address.fromBech32(address);
  if (address.indexOf("bc1p") === 0) {
    const output = bitcoin.address.toOutputScript(address);
    return {
      output: output.toString("hex"),
      scripthash: Buffer.from(sha256(output), "hex").reverse().toString("hex"),
      address,
    };
  } else if (address.indexOf("bc1") === 0) {
    const output = bitcoin.address.toOutputScript(address);
    return {
      output: output.toString("hex"),
      scripthash: Buffer.from(sha256(output), "hex").reverse().toString("hex"),
      address,
    };
  } else if (address.indexOf("tb1") === 0) {
    const output = bitcoin.address.toOutputScript(
      address,
      bitcoin.networks.testnet,
    );
    return {
      output: output.toString("hex"),
      scripthash: Buffer.from(sha256(output), "hex").reverse().toString("hex"),
      address,
    };
  } else if (address.indexOf("bcrt1p") === 0) {
    const output = bitcoin.address.toOutputScript(address);
    return {
      output: output.toString("hex"),
      scripthash: Buffer.from(sha256(output), "hex").reverse().toString("hex"),
      address,
    };
  } else {
    throw "unrecognized address";
  }
}

export function detectAddressType(address: string): boolean {
  try {
    bitcoin.address.fromBase58Check(address);
    return true;
  } catch (err) {}
  if (
    address.indexOf("bc1p") === 0 ||
    address.indexOf("bc1") === 0 ||
    address.indexOf("tb1") === 0 ||
    address.indexOf("bcrt1p") === 0
  ) {
    return true;
  } else {
    return false;
  }
}

export function addressToP2PKH(address: string): string {
  const addressDecoded = bs58check.decode(address);
  const addressDecodedSub = addressDecoded.toString().substr(2);
  const p2pkh = `76a914${addressDecodedSub}88ac`;
  return p2pkh;
}

export function detectScriptToAddressType(
  script: string,
  network?: bitcoin.Network,
): string {
  const address = bitcoin.address.fromOutputScript(
    Buffer.from(script, "hex"),
    network || bitcoin.networks.bitcoin,
  );
  return address;
}
