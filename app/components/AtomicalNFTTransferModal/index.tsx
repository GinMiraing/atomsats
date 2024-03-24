import { zodResolver } from "@hookform/resolvers/zod";
import { Psbt, networks } from "bitcoinjs-lib";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getElectrumClient } from "@/lib/apis/atomical";
import { pushTx } from "@/lib/apis/mempool";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { usePureUTXOs } from "@/lib/hooks/usePureUTXOs";
import { useToast } from "@/lib/hooks/useToast";
import { cn, formatAddress } from "@/lib/utils";
import {
  detectAddressTypeToScripthash,
  detectScriptToAddressType,
  getInputExtra,
} from "@/lib/utils/address-helpers";
import { coinselect, toOutputScript } from "@/lib/utils/bitcoin-utils";
import { formatError } from "@/lib/utils/error-helpers";

import { AccountAtomical } from "@/routes/address.$address/types";

import { renderAddressPreview } from "../AtomicalPreview";
import { Button } from "../Button";
import CopyButton from "../CopyButton";
import { Dialog, DialogContent, DialogHeader } from "../Dialog";
import { Drawer, DrawerContent, DrawerHeader } from "../Drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../Form";
import GasFeeSelector from "../GasFeeSelector";
import { Input } from "../Input";
import { useWallet } from "../Wallet/hooks";

const FormSchema = z.object({
  receiver: z.string().min(1),
  gasFeeRate: z.number().int().min(1),
});

type FormSchemaType = z.infer<typeof FormSchema>;

const AtomicalNFTTransferModal: React.FC<{
  atomical?: AccountAtomical;
  utxo?: {
    txid: string;
    value: number;
    vout: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}> = ({ atomical, utxo, onClose, onSuccess }) => {
  const { account, setModalOpen, connector } = useWallet();
  const { toast } = useToast();
  const { isMobile } = useMediaQuery();
  const { data: UTXOs } = usePureUTXOs();
  const electrum = getElectrumClient(networks.bitcoin);

  const [loading, setLoading] = useState(false);
  const [pushedTx, setPushedTx] = useState("");

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      receiver: "",
      gasFeeRate: 1,
    },
    mode: "onSubmit",
  });

  const watchReceiver = form.watch("receiver");
  const watchGasFee = form.watch("gasFeeRate");

  const onSubmit = async (values: FormSchemaType) => {
    if (
      !atomical ||
      !utxo ||
      !UTXOs ||
      UTXOs.length === 0 ||
      values.gasFeeRate === 0
    )
      return;

    if (!account || !connector) {
      setModalOpen(true);
      return;
    }

    try {
      setLoading(true);

      try {
        detectAddressTypeToScripthash(values.receiver);
      } catch (e) {
        throw new Error("Invalid receiver address");
      }

      const { atomicals, location_info } = await electrum.atomicalsAtLocation(
        `${utxo.txid}i${utxo.vout}`,
      );

      if (!atomicals || !location_info || atomicals.length === 0) {
        throw new Error("This location not contains atomical");
      }

      if (atomicals.length > 1) {
        throw new Error("This location contains more than one atomical");
      }

      try {
        const address = detectScriptToAddressType(location_info.script);

        if (address !== account.address) {
          throw new Error("Invalid address");
        }
      } catch (e) {
        throw new Error("Invalid address");
      }

      const { feeInputs, outputs } = coinselect(
        account,
        UTXOs,
        [
          {
            script: toOutputScript(values.receiver, networks.bitcoin),
            value: utxo.value,
          },
        ],
        values.gasFeeRate,
        [
          {
            value: utxo.value,
          },
        ],
      );

      const psbt = new Psbt({ network: networks.bitcoin });

      for (const input of feeInputs) {
        psbt.addInput(input);
      }

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: account.script,
          value: utxo.value,
        },
        ...getInputExtra(account),
      });

      for (const output of outputs) {
        psbt.addOutput(output);
      }

      const signedPsbtHex = await connector.signPsbt(psbt.toHex(), {
        autoFinalized: true,
      });

      const signedPsbt = Psbt.fromHex(signedPsbtHex);
      const rawTx = signedPsbt.extractTransaction();
      const txid = rawTx.getId();
      const refundVout =
        signedPsbt.txOutputs[signedPsbt.txOutputs.length - 1].address ===
        account.address
          ? signedPsbt.txOutputs.length - 1
          : null;

      await pushTx(networks.bitcoin, rawTx.toHex());

      if (refundVout !== null) {
        window.localStorage.setItem(
          `safeUTXOs-${account.address}`,
          JSON.stringify({
            [txid]: refundVout,
          }),
        );
      }

      setPushedTx(txid);
    } catch (e) {
      console.log(e);
      toast({
        duration: 2000,
        variant: "destructive",
        title: "List failed",
        description: formatError(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!atomical || !utxo) {
      form.reset({
        receiver: "",
      });
    }
  }, [atomical, utxo]);

  useEffect(() => {
    if (!account) {
      onClose();
      return;
    }
  }, [account]);

  if (isMobile) {
    return (
      <>
        <Drawer
          open={!!atomical && !!utxo}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <DrawerContent className="space-y-4 px-4 pb-8">
            <DrawerHeader>Transfer Your Atomical</DrawerHeader>
            <div className="relative mx-auto flex w-64 items-center justify-center overflow-hidden rounded-md bg-card">
              <div className="flex aspect-square w-full items-center justify-center">
                {atomical &&
                  renderAddressPreview({
                    subtype: atomical?.subtype || "",
                    atomicalId: atomical?.atomicalId || "",
                    payload: {
                      realm: atomical?.requestRealm || "",
                      parentContainer: atomical?.parentContainer,
                    },
                  })}
              </div>
              <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
                {`#${atomical?.atomicalNumber || "000000"}`}
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-col space-y-4">
                  <FormField
                    control={form.control}
                    name="receiver"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atomical Receiver</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input
                              className="pr-10"
                              {...field}
                            />
                            <X
                              onClick={() => form.setValue("receiver", "")}
                              className={cn(
                                "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                                {
                                  hidden: !watchReceiver,
                                },
                              )}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Gas Fee</FormLabel>
                    <GasFeeSelector
                      feeRate={watchGasFee}
                      onFeeRateChange={(value) =>
                        form.setValue("gasFeeRate", value)
                      }
                    />
                  </FormItem>
                  <div className="flex flex-col items-end justify-end space-y-2">
                    <div className="text-green-400">{`Sats In Atomical: ${utxo?.value || 1000} sats`}</div>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-8 flex w-full items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Transfer"
                  )}
                </Button>
              </form>
            </Form>
          </DrawerContent>
        </Drawer>
        <Dialog
          open={!!pushedTx}
          onOpenChange={(open) => {
            if (!open) {
              setPushedTx("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <div className="text-lg">Transaction Sent</div>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center space-x-4">
                <a
                  href={`https://mempool.space/tx/${pushedTx}`}
                  target="_blank"
                  className="text-sm transition-colors hover:text-theme-hover"
                >
                  {formatAddress(pushedTx, 12)}
                </a>
                <CopyButton text={pushedTx} />
              </div>
              <Button
                className="w-32"
                type="button"
                onClick={() => {
                  setPushedTx("");
                  onSuccess();
                }}
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog
        open={!!atomical && !!utxo}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent>
          <DialogHeader>Transfer Your Atomical</DialogHeader>
          <div className="relative mx-auto flex w-64 items-center justify-center overflow-hidden rounded-md bg-card">
            <div className="flex aspect-square w-full items-center justify-center">
              {atomical &&
                renderAddressPreview({
                  subtype: atomical?.subtype || "",
                  atomicalId: atomical?.atomicalId || "",
                  payload: {
                    realm: atomical?.requestRealm || "",
                    parentContainer: atomical?.parentContainer,
                  },
                })}
            </div>
            <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
              {`#${atomical?.atomicalNumber || "000000"}`}
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="receiver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atomical Receiver</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            className="pr-10"
                            {...field}
                          />
                          <X
                            onClick={() => form.setValue("receiver", "")}
                            className={cn(
                              "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                              {
                                hidden: !watchReceiver,
                              },
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Gas Fee</FormLabel>
                  <GasFeeSelector
                    feeRate={watchGasFee}
                    onFeeRateChange={(value) =>
                      form.setValue("gasFeeRate", value)
                    }
                  />
                </FormItem>
                <div className="flex flex-col items-end justify-end space-y-2">
                  <div className="text-green-400">{`Sats In Atomical: ${utxo?.value || 1000} sats`}</div>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="mt-8 flex w-full items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Transfer"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pushedTx}
        onOpenChange={(open) => {
          if (!open) {
            setPushedTx("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="text-lg">Transaction Sent</div>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center space-x-4">
              <a
                href={`https://mempool.space/tx/${pushedTx}`}
                target="_blank"
                className="text-sm transition-colors hover:text-theme-hover"
              >
                {formatAddress(pushedTx, 12)}
              </a>
              <CopyButton text={pushedTx} />
            </div>
            <Button
              className="w-32"
              type="button"
              onClick={() => {
                setPushedTx("");
                onSuccess();
              }}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AtomicalNFTTransferModal;
