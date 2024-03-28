import { zodResolver } from "@hookform/resolvers/zod";
import { networks } from "bitcoinjs-lib";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getElectrumClient } from "@/lib/apis/atomical";
import { useToast } from "@/lib/hooks/useToast";
import { UTXO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { detectScriptToAddressType } from "@/lib/utils/address-helpers";
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
import { useWallet } from "@/components/Wallet/hooks";

const FormShcema = z.object({
  realm: z.string().min(1),
  profile: z.string().min(1),
  bitworkc: z.string().min(4),
});

type FormSchemaType = z.infer<typeof FormShcema>;

const LinkProfile: React.FC<{
  onMint: (content: {
    op: string;
    payload: any;
    options: any;
    preview: any;
  }) => void;
}> = ({ onMint }) => {
  const { toast } = useToast();
  const { account } = useWallet();
  const electrum = getElectrumClient(networks.bitcoin);

  const [loading, setLoading] = useState(false);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormShcema),
    mode: "onSubmit",
    defaultValues: {
      bitworkc: "0000",
      realm: "",
      profile: "",
    },
  });

  const watchRealm = form.watch("realm");
  const watchProfile = form.watch("profile");
  const watchBitworkc = form.watch("bitworkc");

  const onSubmit = async (values: FormSchemaType) => {
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

    try {
      setLoading(true);

      if (!account) {
        throw new Error("Connect wallet first");
      }

      const { result } = await electrum.atomicalsGetByRealm(values.realm);

      if (!result.atomical_id) {
        throw new Error("Realm not found");
      }

      const [realm, profile] = await Promise.all([
        electrum.atomicalsGetState(result.atomical_id, true),
        electrum.atomicalsGetState(values.profile, true),
      ]);

      if (
        !realm.result?.location_info ||
        realm.result.location_info.length === 0 ||
        !profile.result?.location_info ||
        profile.result.location_info.length === 0
      ) {
        throw new Error("Realm or profile location not found");
      }

      try {
        const realmAddress = detectScriptToAddressType(
          realm.result.location_info[0].script,
        );
        const profileAddress = detectScriptToAddressType(
          profile.result.location_info[0].script,
        );

        if (
          realmAddress !== account.address ||
          profileAddress !== account.address
        ) {
          throw new Error("Your not own this atomical");
        }
      } catch (e) {
        throw e;
      }

      const atomicalInput: UTXO = {
        txid: realm.result.location_info[0].txid,
        vout: realm.result.location_info[0].index,
        value: realm.result.location_info[0].value,
        script_pubkey: "", // not use
      };

      const cborContent: any = {
        d: profile.result.atomical_id,
        args: {
          bitworkc: values.bitworkc,
        },
      };

      onMint({
        op: "mod",
        payload: cborContent,
        options: {
          receiver: account.address,
          postagsFee: realm.result.location_info[0].value,
          atomicalInput,
        },
        preview: cborContent,
      });
    } catch (e) {
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Build profile link failed",
        description: formatError(e),
      });
    } finally {
      setLoading(false);
    }
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
            name="profile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Atomical Id</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Input
                      className="pr-10"
                      {...field}
                    />
                    <X
                      onClick={() => form.setValue("profile", "")}
                      className={cn(
                        "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                        {
                          hidden: !watchProfile,
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

export default LinkProfile;
