import { zodResolver } from "@hookform/resolvers/zod";
import { FileJson, FileUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useToast } from "@/lib/hooks/useToast";
import { cn, readFile, readableBytes } from "@/lib/utils";
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

const MAX_SIZE = 380 * 1024;

const FormShcema = z.object({
  outsats: z.string().min(1),
  bitworkc: z.string().min(4),
});

type FormSchemaType = z.infer<typeof FormShcema>;

const BaseMintProfileForm: React.FC<{
  onMint: (content: {
    op: string;
    payload: any;
    options: any;
    preview: any;
  }) => void;
}> = ({ onMint }) => {
  const { account } = useWallet();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormShcema),
    defaultValues: {
      outsats: "546",
      bitworkc: "0000",
    },
    mode: "onSubmit",
  });

  const watchOutsats = form.watch("outsats");
  const watchBitworkc = form.watch("bitworkc");

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

      if (!file) {
        throw new Error("Please select a json file");
      }

      if (!file.type.endsWith("json")) {
        throw new Error("Only json file type is supported");
      }

      if (!account) {
        throw new Error("Connect wallet first");
      }

      const fileContent = (await readFile(file)) as ArrayBuffer;
      const decoder = new TextDecoder("utf-8");
      const jsonText = decoder.decode(fileContent);

      onMint({
        op: "nft",
        payload: {
          ...JSON.parse(jsonText),
          args: {
            bitworkc: values.bitworkc,
          },
        },
        options: {
          receiver: account.address,
          postagsFee: parseInt(values.outsats),
        },
        preview: {
          ...JSON.parse(jsonText),
          args: {
            bitworkc: values.bitworkc,
          },
        },
      });
    } catch (e) {
      toast({
        duration: 2000,
        variant: "destructive",
        title: "Invalid form",
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
          <FormItem>
            <FormLabel>File</FormLabel>
            <div className="flex h-40 w-full rounded-md bg-primary p-4">
              {file ? (
                <div className="flex w-full items-start justify-between space-x-4">
                  <div className="flex items-center space-x-2">
                    <FileJson className="h-8 w-8" />
                    <div className="flex flex-col space-y-1">
                      <div className="font-bold">{file.name}</div>
                      <div
                        className={cn("text-sm text-secondary", {
                          "text-red-500": MAX_SIZE && file.size > MAX_SIZE,
                        })}
                      >
                        {readableBytes(file.size)}
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => setFile(null)}
                    className="h-5 w-5 cursor-pointer rounded-full bg-theme"
                  >
                    <X className="h-full w-full text-white" />
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (fileInput.current) {
                      fileInput.current.click();
                    }
                  }}
                  className="flex h-full w-full cursor-pointer items-center justify-center"
                >
                  <div className="flex items-center space-x-4">
                    <FileUp className="h-5 w-5 text-secondary" />
                    <div className="text-secondary">
                      Click to upload your json file
                    </div>
                  </div>

                  <Input
                    ref={fileInput}
                    onChange={(e) => {
                      const files = e.target.files;

                      if (!files || files.length === 0) return;

                      setFile(files[0]);

                      if (fileInput.current) {
                        fileInput.current.value = "";
                      }
                    }}
                    type="file"
                    className="hidden"
                    accept="application/json"
                    disabled={!!file}
                  />
                </div>
              )}
            </div>
          </FormItem>
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

export default BaseMintProfileForm;
