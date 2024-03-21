import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AxiosInstance from "@/lib/axios";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { usePureUTXOs } from "@/lib/hooks/usePureUTXOs";
import { useToast } from "@/lib/hooks/useToast";
import { OfferSummary } from "@/lib/types/market";
import { cn } from "@/lib/utils";
import { formatError } from "@/lib/utils/error-helpers";

import { renderAddressPreview } from "../AtomicalPreview";
import { Button } from "../Button";
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
import PunycodeString from "../PunycodeString";
import { useWallet } from "../Wallet/hooks";

const FormSchema = z.object({
  receiver: z.string(),
  gasFeeRate: z.number().int().min(1),
});

type FormSchemaType = z.infer<typeof FormSchema>;

const AtomicalBuyModal: React.FC<{
  offer?: OfferSummary;
  onClose: () => void;
}> = ({ offer, onClose }) => {
  const { account, setModalOpen, connector } = useWallet();
  const { toast } = useToast();
  const { data: pureUTXOs } = usePureUTXOs();
  const { isMobile } = useMediaQuery();

  const [loading, setLoading] = useState(false);
  const [offerValid, setOfferValid] = useState(false);
  const lastAccount = useRef("");

  const form = useForm<FormSchemaType>({
    defaultValues: {
      receiver: "",
      gasFeeRate: 1,
    },
    mode: "onSubmit",
  });

  const watchReceiver = form.watch("receiver");
  const watchGasFee = form.watch("gasFeeRate");

  const checkOfferValid = async (id: number) => {
    try {
      setOfferValid(false);
      setLoading(true);

      const { data: offerValid } = await AxiosInstance.post<{
        data: null;
        error: boolean;
        code: number;
      }>(`/api/offer/check/${id}`);

      if (offerValid.error) {
        throw new Error(offerValid.code.toString());
      }

      setOfferValid(true);
    } catch (e) {
      console.log(e);
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Offer check invalid",
        description: formatError(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormSchemaType) => {
    if (!offer || values.gasFeeRate === 0) return;

    if (!account || !connector) {
      setModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const { data: unsignedPsbtResp } = await AxiosInstance.post<{
        data: {
          unsignedPsbt: string;
        };
        error: boolean;
        code: number;
      }>("/api/offer/buy/psbt", {
        offerId: offer.id,
        account: account.address,
        receiver: values.receiver,
        script: account.script.toString("hex"),
        pubkey: account.pubkey.toString("hex"),
        gasFeeRate: values.gasFeeRate,
        utxos: pureUTXOs || [],
      });

      if (unsignedPsbtResp.error) {
        throw new Error(unsignedPsbtResp.code.toString());
      }

      const unsignedPsbt = unsignedPsbtResp.data.unsignedPsbt;

      const signedPsbt = await connector.signPsbt(unsignedPsbt, {
        autoFinalized: false,
      });

      await AxiosInstance.post("/api/offer/buy", {
        id: offer.id,
        signedPsbt,
      });
    } catch (e) {
      console.log(e);
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Buy failed",
        description: formatError(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCost = useMemo(() => {
    if (!offer) return 0;
    const serviceFee = Math.floor(offer.price * 0.01);
    return serviceFee >= 600 ? offer.price + serviceFee : offer.price + 600;
  }, [offer]);

  useEffect(() => {
    if (account && account.address === lastAccount.current) return;

    if (account) {
      lastAccount.current = account.address;
      form.setValue("receiver", account.address);
    }
  }, [account]);

  useEffect(() => {
    if (!offer) {
      lastAccount.current = "";
      form.reset({
        receiver: account?.address || "",
        gasFeeRate: 1,
      });
    } else {
      checkOfferValid(offer.id);
    }
  }, [offer]);

  if (isMobile) {
    return (
      <Drawer
        open={!!offer}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader>
            <div className="flex items-center space-x-2">
              <div>Buy</div>
              <div>
                <PunycodeString
                  children={
                    offer?.type === "dmitem" ? offer.container || "" : "realm"
                  }
                />
              </div>
            </div>
          </DrawerHeader>
          <div className="relative mx-auto flex w-64 items-center justify-center overflow-hidden rounded-md bg-card">
            <div className="flex aspect-square w-full items-center justify-center">
              {offer &&
                renderAddressPreview({
                  subtype: offer?.type || "",
                  atomicalId: offer?.atomicalId || "",
                  payload: {
                    realm: offer?.realm || "",
                  },
                })}
            </div>
            <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
              {`#${offer?.atomicalNumber || "000000"}`}
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
                <GasFeeSelector
                  feeRate={watchGasFee}
                  onFeeRateChange={(value) =>
                    form.setValue("gasFeeRate", value)
                  }
                />
                <div className="flex flex-col items-end justify-end space-y-2">
                  <div className="text-sm">{`Offer Price: ${offer && offer.price} sats`}</div>
                  <div className="text-sm">{`Service Fee: ${offer && Math.floor(offer.price * 0.01) >= 600 ? Math.floor(offer.price * 0.01) : "600"} sats`}</div>
                  <div className="text-green-400">{`Total Cost: ${totalCost} sats`}</div>
                </div>
              </div>
              <Button
                type="submit"
                disabled={
                  loading || !offerValid || account?.address === offer?.lister
                }
                className="mt-8 flex w-full items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : !offerValid ? (
                  "Invalid Offer"
                ) : (
                  "Buy"
                )}
              </Button>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={!!offer}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div>Buy</div>
            <div>
              <PunycodeString
                children={
                  offer?.type === "dmitem" ? offer.container || "" : "realm"
                }
              />
            </div>
          </div>
        </DialogHeader>
        <div className="relative mx-auto flex w-64 items-center justify-center overflow-hidden rounded-md bg-card">
          <div className="flex aspect-square w-full items-center justify-center">
            {offer &&
              renderAddressPreview({
                subtype: offer?.type || "",
                atomicalId: offer?.atomicalId || "",
                payload: {
                  realm: offer?.realm || "",
                },
              })}
          </div>
          <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
            {`#${offer?.atomicalNumber || "000000"}`}
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
              <GasFeeSelector
                feeRate={watchGasFee}
                onFeeRateChange={(value) => form.setValue("gasFeeRate", value)}
              />
              <div className="flex flex-col items-end justify-end space-y-2">
                <div className="text-sm">{`Offer Price: ${offer && offer.price} sats`}</div>
                <div className="text-sm">{`Service Fee: ${offer && offer.price > 60000 ? Math.floor(offer.price * 0.01) : "0"} sats`}</div>
                <div className="text-green-400">{`Total Cost: ${totalCost} sats`}</div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={
                loading || !offerValid || account?.address === offer?.lister
              }
              className="mt-8 flex w-full items-center justify-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !offerValid ? (
                "Invalid Offer"
              ) : (
                "Buy"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AtomicalBuyModal;
