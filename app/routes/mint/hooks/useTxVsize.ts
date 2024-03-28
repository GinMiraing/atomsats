import ecc from "@bitcoinerlab/secp256k1";
import {
  Payment,
  initEccLib,
  networks,
  opcodes,
  payments,
  script,
} from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";

import { UTXO } from "@/lib/types";
import { toXOnly } from "@/lib/utils/address-helpers";
import { estimateTxVbytes, randomBytes } from "@/lib/utils/bitcoin-utils";

initEccLib(ecc);

const ECPair = ECPairFactory(ecc);

class Script {
  bytes: number[];

  static new() {
    return new Script();
  }

  constructor() {
    this.bytes = [];
  }

  pushByte(n: number) {
    if (n < 0 || n > 255) throw new Error("tried to push a non-byte number");

    this.bytes.push(n);
    return this;
  }

  pushBytes(data: Uint8Array) {
    const n = data.length;
    if (n < opcodes.OP_PUSHDATA1) {
      this.pushByte(n);
    } else if (n < 0x100) {
      this.pushByte(opcodes.OP_PUSHDATA1);
      this.pushByte(n);
    } else if (n < 0x10000) {
      this.pushByte(opcodes.OP_PUSHDATA2);
      this.pushByte(n % 0x100);
      this.pushByte(Math.floor(n / 0x100));
    } else if (n < 0x100000000) {
      this.pushByte(opcodes.OP_PUSHDATA4);
      this.pushByte(n % 0x100);
      this.pushByte(Math.floor(n / 0x100) % 0x100);
      this.pushByte(Math.floor(n / 0x10000) % 0x100);
      this.pushByte(Math.floor(n / 0x1000000));
    } else {
      throw new Error("tried to put a 4bn+ sized object into a script!");
    }

    this.bytes = this.bytes.concat(Array.from(data));

    return this;
  }

  pushChunks(chunks: Uint8Array[]) {
    chunks.forEach((chunk) => this.pushBytes(chunk));
    return this;
  }

  pushString(s: string, maxLen?: number) {
    const ec = new TextEncoder();
    const bytes = ec.encode(s);
    if (maxLen && bytes.length > maxLen) {
      const chunks = [];
      for (let i = 0; i < bytes.length; i += maxLen) {
        chunks.push(bytes.subarray(i, i + maxLen));
      }
      return this.pushChunks(chunks);
    }
    return this.pushBytes(ec.encode(s));
  }

  toBuffer() {
    return Buffer.from(this.bytes);
  }

  toHex() {
    return this.toBuffer().toString("hex");
  }

  toAsm() {
    return script.toASM(this.toBuffer());
  }
}

const buildRevealScript = (
  xonlyPublicKey: Buffer,
  inscription: {
    opType: string;
    payload: Uint8Array;
  },
) => {
  const protocol = "atom";

  const chunks = [];
  for (let i = 0; i < inscription.payload.length; i += 520) {
    chunks.push(inscription.payload.subarray(i, i + 520));
  }

  const revealScript = Script.new()
    .pushBytes(xonlyPublicKey)
    .pushByte(opcodes.OP_CHECKSIG)
    .pushByte(opcodes.OP_FALSE)
    .pushByte(opcodes.OP_IF)
    .pushString(protocol)
    .pushString(inscription.opType)
    .pushChunks(chunks)
    .pushByte(opcodes.OP_ENDIF);

  return revealScript.toBuffer();
};

const estimateRevealTxVsize = (p2tr: Payment, inputCount: number) => {
  if (inputCount > 1) {
    return estimateTxVbytes(
      [
        {
          hash: Buffer.alloc(32).fill(0),
          index: 0,
          witness: [Buffer.alloc(64).fill(0), ...p2tr.witness!],
        },
        ...new Array(inputCount - 1).fill({
          hash: Buffer.alloc(32).fill(0),
          index: 0,
          witness: [Buffer.alloc(64).fill(0)],
        }),
      ],
      1,
    );
  } else {
    return estimateTxVbytes(
      [
        {
          hash: Buffer.alloc(32).fill(0),
          index: 0,
          witness: [Buffer.alloc(64).fill(0), ...p2tr.witness!],
        },
      ],
      1,
    );
  }
};

export const useTxVsize = () => {
  const commitTxVsize = estimateTxVbytes(1, 3);

  const getTxFee = ({
    opType,
    payload,
    feeRate,
    postagsFee,
    atomicalInput,
  }: {
    opType: string;
    payload: Uint8Array;
    feeRate: number;
    postagsFee: number;
    atomicalInput?: UTXO;
  }) => {
    const revealKeypair = ECPair.fromPrivateKey(randomBytes(32), {
      network: networks.bitcoin,
    });
    const revealPublicKey = toXOnly(revealKeypair.publicKey);

    const revealScript = buildRevealScript(revealPublicKey, {
      opType,
      payload,
    });
    const p2pkRedeem: Payment = {
      output: revealScript,
      redeemVersion: 192,
    };

    const p2pkP2tr = payments.p2tr({
      internalPubkey: toXOnly(revealKeypair.publicKey),
      scriptTree: {
        output: revealScript,
      },
      redeem: p2pkRedeem,
      network: networks.bitcoin,
    });

    const revealTxVsize = estimateRevealTxVsize(
      p2pkP2tr,
      atomicalInput ? 2 : 1,
    );

    return {
      commitTxFee: commitTxVsize * feeRate,
      revealTxFee: atomicalInput
        ? revealTxVsize * feeRate + postagsFee - atomicalInput.value
        : revealTxVsize * feeRate + postagsFee,
    };
  };

  return {
    getTxFee,
  };
};
