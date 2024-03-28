import { zodResolver } from "@hookform/resolvers/zod";
import { networks } from "bitcoinjs-lib";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getElectrumClient } from "@/lib/apis/atomical";
import { useToast } from "@/lib/hooks/useToast";
import { cn } from "@/lib/utils";
import { detectAddressTypeToScripthash } from "@/lib/utils/address-helpers";
import { isValidBitworkString } from "@/lib/utils/bitcoin-utils";
import { formatError } from "@/lib/utils/error-helpers";

import { Button } from "@/components/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/Form";
import { Input } from "@/components/Input";

const FormShcema = z.object({
  realm: z.string().min(1),
  outsats: z.string().min(1),
  receiver: z.string().min(1),
  bitworkc: z.string().min(4),
  bitworkr: z.union([z.string().min(4), z.string().length(0)]),
});

type FormSchemaType = z.infer<typeof FormShcema>;

const MintForm: React.FC<{
  onMint: (content: {
    op: string;
    payload: any;
    options: any;
    preview: any;
  }) => void;
}> = ({ onMint }) => {
  const { toast } = useToast();
  const electrum = getElectrumClient(networks.bitcoin);

  const [loading, setLoading] = useState(false);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormShcema),
    mode: "onSubmit",
    defaultValues: {
      realm: "",
      outsats: "546",
      receiver: "",
      bitworkc: "0000",
      bitworkr: "",
    },
  });

  const watchRealm = form.watch("realm");
  const watchOutsats = form.watch("outsats");
  const watchReceiver = form.watch("receiver");
  const watchBitworkc = form.watch("bitworkc");
  const watchBitworkr = form.watch("bitworkr");

  const onSubmit = async (values: FormSchemaType) => {
    if (
      values.outsats.includes("e") ||
      !Number.isInteger(parseInt(values.outsats)) ||
      parseInt(values.outsats) < 546
    ) {
      form.setError("outsats", {
        type: "manual",
        message: "Invalid number",
      });
      return;
    }

    try {
      detectAddressTypeToScripthash(values.receiver);
    } catch (e) {
      form.setError("receiver", {
        type: "manual",
        message: "Invalid address",
      });
      return;
    }

    try {
      const bitworkc = isValidBitworkString(values.bitworkc);
      if (!bitworkc) throw new Error("Invalid bitworkc");
    } catch (e) {
      form.setError("bitworkc", {
        type: "manual",
        message: "Invalid bitworkc",
      });
      return;
    }

    if (values.bitworkr) {
      try {
        const bitworkr = isValidBitworkString(values.bitworkr);
        if (!bitworkr) throw new Error("Invalid bitworkr");
      } catch (e) {
        form.setError("bitworkr", {
          type: "manual",
          message: "Invalid bitworkr",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const { result } = await electrum.atomicalsGetByRealm(values.realm);

      if (result.atomical_id) {
        setLoading(false);
        form.setError("realm", {
          type: "manual",
          message: "Realm already exist",
        });
        return;
      }
    } catch (e) {
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Get realm failed",
        description: formatError(e),
      });
    } finally {
      setLoading(false);
    }

    const cborContent: any = {
      args: {
        request_realm: values.realm,
        bitworkc: values.bitworkc,
      },
    };

    if (values.bitworkr) {
      cborContent.args.bitworkr = values.bitworkr;
    }

    onMint({
      op: "nft",
      payload: cborContent,
      options: {
        receiver: values.receiver,
        postagsFee: parseInt(values.outsats),
      },
      preview: cborContent,
    });
  };

  return (
    <Form {...form}>
      <form
        className="w-full space-y-8 rounded-md bg-secondary p-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="w-full space-y-4">
          <FormField
            control={form.control}
            name="realm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Realm Name</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Input
                      className="pr-10"
                      {...field}
                    />
                    <X
                      onClick={() => form.setValue("realm", "")}
                      className={cn(
                        "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                        {
                          hidden: !watchRealm,
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
            name="outsats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output Value (Sats)</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Input
                      className="pr-10"
                      type="number"
                      step={1}
                      min={546}
                      {...field}
                    />
                    <X
                      onClick={() => form.setValue("outsats", "")}
                      className={cn(
                        "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                        {
                          hidden: !watchOutsats,
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
                <FormLabel>Receiver</FormLabel>
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
            name="bitworkc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commit Bitwork</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Input
                      className="pr-10"
                      {...field}
                    />
                    <X
                      onClick={() => form.setValue("bitworkc", "")}
                      className={cn(
                        "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                        {
                          hidden: !watchBitworkc,
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
            name="bitworkr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reveal Bitwork</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Input
                      className="pr-10"
                      {...field}
                    />
                    <X
                      onClick={() => form.setValue("bitworkr", "")}
                      className={cn(
                        "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                        {
                          hidden: !watchBitworkr,
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
          disabled={loading}
          type="submit"
          className="flex w-full items-center justify-center"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Next"}
        </Button>
      </form>
    </Form>
  );
};

export default MintForm;
