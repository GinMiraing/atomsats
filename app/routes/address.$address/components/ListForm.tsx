import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Textarea } from "@/components/Textarea";
import { useWallet } from "@/components/Wallet/hooks";

import { useListAtomical } from "../hooks/useList";
import { AccountAtomical } from "../types";

const FormSchema = z.object({
  price: z.string().min(1),
  receiver: z.string().min(1),
  description: z.string().max(200).optional(),
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
  const { listAtomical } = useListAtomical();

  const [loading, setLoading] = useState(false);
  const lastAccount = useRef("");

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      price: "0",
      receiver: "",
      description: "",
    },
    mode: "onSubmit",
  });

  const watchPrice = form.watch("price");
  const watchReceiver = form.watch("receiver");

  const onSubmit = async (values: FormSchemaType) => {
    if (!atomical || !utxo) return;

    if (!account || !connector) {
      setModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      await listAtomical({
        atomical,
        price: parseInt(values.price),
        receiver: values.receiver,
        description: values.description,
        utxo,
      });
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
    if (!account) {
      onClose();
      return;
    }

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
        description: "",
      });
    } else if (atomical.listed) {
      form.reset({
        price: atomical.listed.price.toString(),
        receiver: atomical.listed.receiver,
        description: atomical.listed.description,
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
        <DrawerContent className="space-y-4 px-4 pb-8">
          <DrawerHeader>
            {atomical?.listed ? "Edit" : "List"} Your Atomical
          </DrawerHeader>
          <div className="relative mx-auto flex w-48 items-center justify-center overflow-hidden rounded-md bg-card lg:w-64">
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
              <div className="box-content max-h-[30vh] w-full overflow-y-scroll py-2 pr-1">
                <div className="flex w-full flex-col space-y-4">
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
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Description</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Textarea
                              placeholder="Give your item a description, this will be shown to the buyer."
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
        <div className="relative mx-auto flex w-48 items-center justify-center overflow-hidden rounded-md bg-card lg:w-64">
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
            <div className="box-content max-h-[30vh] w-full overflow-y-scroll py-2 pr-1">
              <div className="flex w-full flex-col space-y-4">
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Description</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Textarea
                            placeholder="Give your item a description, this will be shown to the buyer."
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
