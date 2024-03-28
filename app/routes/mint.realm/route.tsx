import { Psbt } from "bitcoinjs-lib";
import * as cbor from "cbor-x";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { pushTx } from "@/lib/apis/mempool";
import { usePureUTXOs } from "@/lib/hooks/usePureUTXOs";
import { useToast } from "@/lib/hooks/useToast";
import { UTXO } from "@/lib/types";
import { cn, sleep } from "@/lib/utils";
import { formatError } from "@/lib/utils/error-helpers";

import { Button } from "@/components/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/Collapsible";
import GasFeeSelector from "@/components/GasFeeSelector";
import { Label } from "@/components/Label";
import { RadioGroup, RadioGroupItem } from "@/components/RadioGroup";
import { useWallet } from "@/components/Wallet/hooks";

import { useTxVsize } from "../mint/hooks/useTxVsize";
import BaseMintProfileForm from "./components/BaseMintProfileForm";
import Complete from "./components/Complete";
import LinkProfile from "./components/LinkProfile";
import MinMintProfileForm from "./components/MinMintProfileForm";
import MintForm from "./components/MintForm";
import MintProcess from "./components/MintProcess";

class AtomicalMintCommitTxWorker {
  workers: Worker[];
  sequenceRange: number;

  constructor(
    concurrency = 10,
    sequenceRange = 429496700,
    private updateState: (index: string, count: number) => void,
  ) {
    this.sequenceRange = sequenceRange;
    this.workers = Array.from({ length: concurrency }).map((_, i) => {
      const workerName = `mint-worker-${i}`;
      return new Worker("/worker/worker.js", {
        name: workerName,
      });
    });
  }

  async buildTx(data: {
    inscription: {
      opType: string;
      payload: any;
    };
    network: string;
    account: {
      address: string;
      pubkey: string;
    };
    receiver: string;
    postagsFee: number;
    feeRate: number;
    utxos: UTXO[];
    atomicalInput?: UTXO;
  }): Promise<{
    commitPsbtHex: string;
    revealPsbtHex: string;
  }> {
    return new Promise((resolve, reject) => {
      let resolved = false;

      this.workers.forEach((worker, index) => {
        const sequenceStart = this.sequenceRange * index;
        const sequenceEnd = this.sequenceRange * (index + 1);

        const workerData = {
          ...data,
          sequenceStart,
          sequenceEnd,
        };

        worker.addEventListener("message", (event) => {
          this.updateState(index.toString(), event.data.completeSequence);
          if (event.data.commitPsbtHex && event.data.revealPsbtHex) {
            if (!resolved) {
              resolved = true;
              this.terminate();
              resolve(event.data);
            }
          }
        });

        worker.addEventListener("error", (e) => {
          if (!resolved) {
            resolved = true;
            this.terminate();
            reject(e);
          }
        });

        worker.postMessage(workerData);
      });
    });
  }

  terminate() {
    this.workers.forEach((worker) => worker.terminate());
  }
}

export default function MintRealm() {
  const { getTxFee } = useTxVsize();
  const { account, setModalOpen, connector } = useWallet();
  const { data: pureUTXOs } = usePureUTXOs();
  const { toast } = useToast();

  const [mintType, setMintType] = useState("mint");
  const [content, setContent] = useState<{
    op: string;
    payload: any;
    options: any;
    preview: any;
  }>({
    op: "",
    payload: {},
    options: {},
    preview: {},
  });
  const [step, setStep] = useState(1);
  const [gasFee, setGasFee] = useState(0);
  const [completedCountState, setCompletedCountState] = useState<
    Record<string, number>
  >({});
  const [vsizeSats, setVsizeSats] = useState({
    postagsFee: 0,
    revealTxFee: 0,
    commitTxFee: 0,
  });
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [isWorkerActive, setIsWorkerActive] = useState(false);
  const [storeTxHex, setStoreTxHex] = useState({
    commit: "",
    reveal: "",
  });
  const [storeTxId, setStoreTxId] = useState({
    commit: "",
    reveal: "",
  });
  const [loading, setLoading] = useState(false);

  const workerRef = useRef<AtomicalMintCommitTxWorker | null>(null);

  const buildVsizeSats = ({
    op,
    payload,
    options,
    preview,
  }: {
    op: string;
    payload: any;
    options: any;
    preview: any;
  }) => {
    const { commitTxFee, revealTxFee } = getTxFee({
      opType: op,
      payload: cbor.encode(payload),
      feeRate: gasFee,
      postagsFee: parseInt(options?.postags || 546),
      atomicalInput: options?.atomicalInput,
    });

    setVsizeSats({
      postagsFee: parseInt(options?.postags || 546),
      revealTxFee: revealTxFee,
      commitTxFee: commitTxFee,
    });

    setStep(2);

    setContent({
      op,
      payload,
      options,
      preview,
    });
  };

  const mint = async () => {
    if (!account || !connector) {
      setModalOpen(true);
      return;
    }

    try {
      if (!pureUTXOs || pureUTXOs.length === 0) {
        throw new Error("No UTXOs available");
      }

      if (!content.options.postagsFee || !content.options.receiver) {
        throw new Error("Invalid options");
      }

      if (!workerRef.current) {
        throw new Error("Worker not build");
      }

      setStep(3);

      const data = {
        inscription: {
          opType: content.op,
          payload: content.payload,
        },
        network: "bitcoin",
        account: {
          address: account.address,
          pubkey: account.pubkey.toString("hex"),
        },
        receiver: content.options.receiver,
        postagsFee: content.options.postagsFee,
        feeRate: gasFee,
        utxos: pureUTXOs,
        atomicalInput: content.options.atomicalInput,
      };

      const { commitPsbtHex, revealPsbtHex } =
        await workerRef.current.buildTx(data);
      workerRef.current.terminate();

      setLoading(true);

      let revealTxHex = "";

      const signedCommitPsbt = await connector.signPsbt(commitPsbtHex, {
        autoFinalized: true,
      });

      const revealPsbt = Psbt.fromHex(revealPsbtHex);

      if (revealPsbt.txInputs.length > 1) {
        const signedRevealPsbt = await connector.signPsbt(revealPsbt.toHex(), {
          autoFinalized: true,
        });

        revealTxHex = Psbt.fromHex(signedRevealPsbt)
          .extractTransaction()
          .toHex();
      } else {
        revealTxHex = revealPsbt.extractTransaction().toHex();
      }

      setStoreTxHex({
        commit: Psbt.fromHex(signedCommitPsbt).extractTransaction().toHex(),
        reveal: revealTxHex,
      });

      const commitTxId = await pushTx(
        account.network,
        Psbt.fromHex(signedCommitPsbt).extractTransaction().toHex(),
      );

      await sleep(2000);

      const revealTxId = await pushTx(account.network, revealTxHex);

      setStoreTxId({
        commit: commitTxId,
        reveal: revealTxId,
      });
      setStoreTxHex({
        commit: "",
        reveal: "",
      });
      setStep(4);
    } catch (e) {
      console.log(e);
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Error",
        description: formatError(e),
      });
    } finally {
      setStep(4);
      setLoading(false);
      setIsWorkerActive(false);
    }
  };

  useEffect(() => {
    if (isWorkerActive && !workerRef.current) {
      workerRef.current = new AtomicalMintCommitTxWorker(
        10,
        429496700,
        (index, count) => {
          setCompletedCountState((prevState) => ({
            ...prevState,
            [index]: count,
          }));
        },
      );

      mint();
    }

    return () => {
      if (workerRef.current) {
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
  }, [isWorkerActive]);

  return (
    <div className="w-full space-y-6">
      <RadioGroup
        value={mintType}
        onValueChange={(value) => {
          setStep(1);
          setContent({
            op: "",
            payload: {},
            options: {},
            preview: {},
          });
          setMintType(value);
        }}
        className="flex w-full items-center justify-center space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="mint"
            id="mint"
          />
          <Label htmlFor="mint">Mint</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="mintProfile"
            id="mintProfile"
          />
          <Label htmlFor="mintProfile">Mint Profile</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="mintProfileJson"
            id="mintProfileJson"
          />
          <Label htmlFor="mintProfileJson">Mint Profile (Json)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="linkProfile"
            id="linkProfile"
          />
          <Label htmlFor="linkProfile">Link Profile To Realm</Label>
        </div>
      </RadioGroup>
      <div className="mx-auto w-full max-w-2xl">
        <div
          className={cn("w-full", {
            hidden: step === 2,
          })}
        >
          {mintType === "mint" ? (
            <MintForm
              onMint={(value) => {
                buildVsizeSats(value);
              }}
            />
          ) : mintType === "mintProfile" ? (
            <MinMintProfileForm
              onMint={(value) => {
                buildVsizeSats(value);
              }}
            />
          ) : mintType === "mintProfileJson" ? (
            <BaseMintProfileForm
              onMint={(value) => {
                buildVsizeSats(value);
              }}
            />
          ) : (
            <LinkProfile
              onMint={(value) => {
                buildVsizeSats(value);
              }}
            />
          )}
        </div>
        <div
          className={cn("w-full space-y-6 rounded-md bg-secondary p-4", {
            hidden: step === 1,
          })}
        >
          <div className="space-y-4">
            <div>Op Type</div>
            <div className="flex items-center overflow-hidden rounded-md bg-card px-4 py-2">
              {content.op}
            </div>
          </div>
          <div className="space-y-4">
            <div>Payload</div>
            <pre className="flex items-center overflow-hidden whitespace-pre-wrap break-all rounded-md bg-card px-4 py-2">
              {JSON.stringify(content.preview, null, 2)}
            </pre>
          </div>
          <div className="space-y-4">
            <div>Gas Fee</div>
            <GasFeeSelector
              feeRate={gasFee}
              onFeeRateChange={(value) => setGasFee(value)}
            />
          </div>
          <div className="space-y-4">
            <Collapsible
              open={collapsibleOpen}
              onOpenChange={setCollapsibleOpen}
            >
              <CollapsibleTrigger asChild>
                <div className="flex w-full cursor-pointer items-center justify-between rounded-t-md bg-card px-3 py-2">
                  <div>Total</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-green-400">
                      {`${
                        vsizeSats.postagsFee +
                        vsizeSats.revealTxFee +
                        vsizeSats.commitTxFee
                      } Sats`}
                    </div>
                    {collapsibleOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="rounded-b-md bg-card px-3 py-2">
                <div className="flex w-full flex-col space-y-2">
                  <div className="flex w-full items-center justify-between space-x-4">
                    <div>Atommical Sats</div>
                    <div>{vsizeSats.postagsFee} Sats</div>
                  </div>
                  <div className="flex w-full items-center justify-between space-x-4">
                    <div>Reveal Tx Fee</div>
                    <div>{vsizeSats.revealTxFee} Sats</div>
                  </div>
                  <div className="flex w-full items-center justify-between space-x-4">
                    <div>Commit Tx Fee</div>
                    <div>{vsizeSats.commitTxFee} Sats</div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="flex w-full items-center space-x-4">
            <Button
              type="button"
              className="basis-1/2"
              onClick={() => setStep(1)}
              variant={"primary"}
            >
              Back
            </Button>
            <Button
              type="button"
              className="basis-1/2"
              onClick={() => {
                if (!account) {
                  setModalOpen(true);
                  return;
                }

                setIsWorkerActive(true);
              }}
            >
              Mint
            </Button>
          </div>
        </div>
      </div>
      <MintProcess
        completedCountState={completedCountState}
        loading={loading}
        open={step === 3}
        onCancel={() => {
          setIsWorkerActive(false);
          setCompletedCountState({});
          setStep(2);
        }}
      />
      <Complete
        open={step === 4}
        txHex={storeTxHex}
        txId={storeTxId}
        onClose={() => {
          setContent({
            op: "",
            payload: {},
            options: {},
            preview: {},
          });
          setStep(1);
          setVsizeSats({
            postagsFee: 0,
            revealTxFee: 0,
            commitTxFee: 0,
          });
          setStoreTxHex({
            commit: "",
            reveal: "",
          });
          setStoreTxId({
            commit: "",
            reveal: "",
          });
        }}
      />
    </div>
  );
}
