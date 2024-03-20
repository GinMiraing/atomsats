import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AxiosInstance from "@/lib/axios";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";
import { formatError } from "@/lib/utils/error-helpers";

import { renderAddressPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";
import { Dialog, DialogContent, DialogHeader } from "@/components/Dialog";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/Drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/Form";
import { Input } from "@/components/Input";
import { useWallet } from "@/components/Wallet/hooks";

import { AccountAtomical } from "../types";

const FormSchema = z.object({
  price: z.string().min(1),
  receiver: z.string().min(1),
});

type FormSchemaType = z.infer<typeof FormSchema>;

const ListForm: React.FC<{
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

  const [loading, setLoading] = useState(false);
  const lastAccount = useRef("");

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    mode: "onSubmit",
    defaultValues: {
      price: "0",
      receiver: "",
    },
  });

  const watchPrice = form.watch("price");
  const watchReceiver = form.watch("receiver");

  const onSubmit = async (values: FormSchemaType) => {
    if (!atomical || !utxo) return;

    if (!account || !connector) {
      setModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const intPrice = parseInt(values.price);

      if (intPrice <= 0 || intPrice >= 500000000) {
        throw new Error("Price must be between 1 and 500,000,000 sats");
      }

      const { data: unsignedPsbtResp } = await AxiosInstance.post<{
        data: {
          unsignedPsbt: string;
        };
        error: false;
        code: 0;
      }>("/api/offer/create/psbt", {
        price: intPrice,
        receiver: values.receiver,
        value: utxo.value,
        atomicalId: atomical.atomicalId,
        listAccount: account.address,
        tx: utxo.txid,
        vout: utxo.vout,
        script: account.script.toString("hex"),
        pubkey: account.pubkey.toString("hex"),
      });

      if (unsignedPsbtResp.error) {
        throw new Error(unsignedPsbtResp.code.toString());
      }

      const unsignedPsbt = unsignedPsbtResp.data.unsignedPsbt;

      const signedPsbt = await connector.signPsbt(unsignedPsbt, {
        autoFinalized: false,
      });

      const { data: offerResp } = await AxiosInstance.post(
        "/api/offer/create",
        {
          atomicalId: atomical.atomicalId,
          atomicalNumber: atomical.atomicalNumber,
          type: atomical.subtype,
          price: intPrice,
          listAccount: account.address,
          receiver: values.receiver,
          unsignedPsbt,
          signedPsbt,
          tx: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          realm: atomical.requestRealm,
          dmitem: atomical.requestDmitem,
          container: atomical.parentContainerName,
        },
      );

      if (offerResp.error) {
        throw new Error(offerResp.code.toString());
      }

      onClose();
      onSuccess();
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
    if (account && account.address === lastAccount.current) return;

    if (account) {
      lastAccount.current = account.address;
      form.setValue("receiver", account.address);
    }
  }, [account]);

  useEffect(() => {
    if (!atomical) {
      lastAccount.current = "";
      form.reset({
        price: "0",
        receiver: account?.address || "",
      });
    } else if (atomical.listed) {
      form.reset({
        price: atomical.listed.price.toString(),
        receiver: atomical.listed.receiver,
      });
    }
  }, [atomical, utxo]);

  if (isMobile) {
    return (
      <Drawer
        open={!!atomical && !!utxo}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader>
            {atomical?.listed ? "Edit" : "List"} Your Atomical
          </DrawerHeader>
          <div className="bg-card relative mx-auto flex w-64 items-center justify-center overflow-hidden rounded-md">
            <div className="flex aspect-square w-full items-center justify-center">
              {atomical &&
                renderAddressPreview({
                  subtype: atomical?.subtype || "",
                  atomicalId: atomical?.atomicalId || "",
                  payload: {
                    realm: atomical?.requestRealm || "",
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (Sats)</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            className="pr-10"
                            type="number"
                            step={1}
                            min={0}
                            {...field}
                          />
                          <X
                            onClick={() => form.setValue("price", "")}
                            className={cn(
                              "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                              {
                                hidden: !watchPrice,
                              },
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Receiver</FormLabel>
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
              </div>
              <Button
                type="submit"
                disabled={
                  loading ||
                  watchPrice === "" ||
                  watchPrice === "0" ||
                  watchPrice.includes("e")
                }
                className="mt-8 flex w-full items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : atomical?.listed ? (
                  "Edit"
                ) : (
                  "List"
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
      open={!!atomical && !!utxo}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          {atomical?.listed ? "Edit" : "List"} Your Atomical
        </DialogHeader>
        <div className="bg-card relative mx-auto flex w-64 items-center justify-center overflow-hidden rounded-md">
          <div className="flex aspect-square w-full items-center justify-center">
            {atomical &&
              renderAddressPreview({
                subtype: atomical?.subtype || "",
                atomicalId: atomical?.atomicalId || "",
                payload: {
                  realm: atomical?.requestRealm || "",
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Sats)</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <Input
                          className="pr-10"
                          type="number"
                          step={1}
                          min={0}
                          {...field}
                        />
                        <X
                          onClick={() => form.setValue("price", "")}
                          className={cn(
                            "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                            {
                              hidden: !watchPrice,
                            },
                          )}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Receiver</FormLabel>
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
            </div>
            <Button
              type="submit"
              disabled={
                loading ||
                watchPrice === "" ||
                watchPrice === "0" ||
                watchPrice.includes("e")
              }
              className="mt-8 flex w-full items-center justify-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : atomical?.listed ? (
                "Edit"
              ) : (
                "List"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ListForm;
