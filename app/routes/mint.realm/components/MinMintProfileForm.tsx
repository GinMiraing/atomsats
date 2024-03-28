import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@radix-ui/react-dialog";
import { networks } from "bitcoinjs-lib";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { z } from "zod";

import { getElectrumClient } from "@/lib/apis/atomical";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useToast } from "@/lib/hooks/useToast";
import { cn, formatAddress, getFileExtension } from "@/lib/utils";
import { isValidBitworkString } from "@/lib/utils/bitcoin-utils";
import { formatError } from "@/lib/utils/error-helpers";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/Command";
import { DialogContent, DialogHeader } from "@/components/Dialog";
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

const FormShcema = z.object({
  name: z.string().min(1),
  desc: z.string().min(1),
  outsats: z.string().min(1),
  bitworkc: z.string().min(4),
});

type FormSchemaType = z.infer<typeof FormShcema>;

const MinMintProfileForm: React.FC<{
  onMint: (content: {
    op: string;
    payload: any;
    options: any;
    preview: any;
  }) => void;
}> = ({ onMint }) => {
  const electrum = getElectrumClient(networks.bitcoin);
  const { account } = useWallet();
  const { toast } = useToast();
  const { data: accountAtomicals } = useSWR(
    account ? `nfts-${account.address}` : "nfts",
    async () => {
      if (!account) return [];

      const { atomicals } = await electrum.atomicalsByAddress(account.address);

      return Object.values(atomicals).filter((a) => a.type === "NFT");
    },
    {
      refreshInterval: 1000 * 30,
    },
  );

  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const [imageId, setImageId] = useState("");
  const [realmId, setRealmId] = useState<string[]>([]);
  const [wallets, setWallets] = useState<
    {
      name: string;
      address: string;
    }[]
  >([]);
  const [links, setLinks] = useState<
    {
      type: string;
      name: string;
      url: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const realms = useMemo(() => {
    if (!accountAtomicals) return [];
    return accountAtomicals.filter((a) =>
      ["realm", "subrealm"].includes(a.subtype),
    );
  }, [accountAtomicals]);

  const imageAtomicals = useMemo(() => {
    if (!accountAtomicals) return [];
    return accountAtomicals.reduce<
      {
        atomicalId: string;
        atomicalNumber: number;
        parentContainer?: string;
        contentType: string;
      }[]
    >((acc, a) => {
      if (a.subtype?.startsWith("request")) return acc;

      const data = Object.entries(a.data.mint_data.fields).filter(
        (v) => v[0] !== "args",
      );

      if (data.length === 0) return acc;

      const contentType = getFileExtension(data[0][0]).toLowerCase();

      if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(contentType)) {
        acc.push({
          atomicalId: a.atomical_id,
          atomicalNumber: a.atomical_number,
          parentContainer: a.data.$parent_container,
          contentType,
        });
      }

      return acc;
    }, []);
  }, [accountAtomicals]);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormShcema),
    defaultValues: {
      name: "",
      desc: "",
      outsats: "546",
      bitworkc: "0000",
    },
    mode: "onSubmit",
  });

  const watchOutsats = form.watch("outsats");
  const watchName = form.watch("name");
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

      if (!imageId) {
        throw new Error("Please select an image");
      }

      if (wallets.length === 0) {
        throw new Error("Please add a wallet");
      }

      if (links.length === 0) {
        throw new Error("Please add a link");
      }

      if (realmId.length === 0) {
        throw new Error("Please select a realm");
      }

      if (!account) {
        throw new Error("Connect wallet first");
      }

      realmId.forEach((r) => {
        if (
          !realms.find(
            (realm) =>
              realm.data.$request_realm === r ||
              realm.data.$request_subrealm === r,
          )
        ) {
          throw new Error("Invalid realm");
        }
      });

      const matchedImage = imageAtomicals.find((a) => a.atomicalId === imageId);

      if (!matchedImage) {
        throw new Error("Invalid image");
      }

      const profile: any = {};

      profile.v = "1.2";
      profile.name = values.name;
      profile.image = `atom:btc:id:${matchedImage.atomicalId}/image.${matchedImage.contentType}`;
      profile.desc = values.desc;
      profile.ids = realmId.reduce<{
        [key: string]: {
          t: "realm";
          v: string;
        };
      }>((acc, r, i) => {
        acc[i.toString()] = {
          t: "realm",
          v: r,
        };
        return acc;
      }, {});

      profile.wallets = wallets.reduce<{
        [key: string]: {
          address: string;
        };
      }>((acc, w) => {
        acc[w.name] = {
          address: w.address,
        };
        return acc;
      }, {});

      profile.links = {
        "0": {},
      };

      profile.links["0"] = {
        group: "social",
        items: links.reduce<{
          [key: string]: {
            type: string;
            name: string;
            url: string;
          };
        }>((acc, l, i) => {
          acc[i.toString()] = {
            type: l.type,
            name: l.name,
            url: l.url,
          };
          return acc;
        }, {}),
      };

      onMint({
        op: "nft",
        payload: {
          ...profile,
          args: {
            bitworkc: values.bitworkc,
          },
        },
        options: {
          receiver: account.address,
          postagsFee: parseInt(values.outsats),
        },
        preview: {
          ...profile,
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Input
                      className="pr-10"
                      {...field}
                    />
                    <X
                      onClick={() => form.setValue("name", "")}
                      className={cn(
                        "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                        {
                          hidden: !watchName,
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
            name="desc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Textarea
                      placeholder="Your realm description"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Image</FormLabel>
            <Command>
              <CommandInput placeholder="Search atomical number..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <div className="flex flex-wrap">
                    {imageAtomicals.map((atomical) => (
                      <CommandItem
                        key={atomical.atomicalNumber}
                        value={atomical.atomicalNumber.toString()}
                        className={cn(
                          "pointer-events-auto basis-1/3 cursor-pointer p-1",
                          {
                            "-order-1": imageId === atomical.atomicalId,
                          },
                        )}
                      >
                        <div
                          onClick={() => setImageId(atomical.atomicalId)}
                          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-card"
                        >
                          {renderIndexerPreview({
                            atomicalId: atomical.atomicalId,
                            subtype: "",
                            payload: {
                              parentContainer: atomical.parentContainer,
                            },
                          })}
                          <div className=" absolute left-2 top-2 rounded-md bg-theme px-2 py-1 text-xs">
                            {atomical.atomicalNumber}
                          </div>
                          {imageId === atomical.atomicalId && (
                            <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-theme">
                              <Check className="h-full w-full text-white" />
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </FormItem>
          <FormItem>
            <FormLabel>Realm</FormLabel>
            <Command>
              <CommandInput placeholder="Search realm name..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <div className="flex flex-wrap">
                    {realms.map((realm) => (
                      <CommandItem
                        key={realm.atomical_id}
                        value={
                          realm.data.$request_realm ||
                          realm.data.$request_subrealm
                        }
                        className={cn(
                          "pointer-events-auto basis-1/3 cursor-pointer p-1",
                          {
                            "-order-1": realmId.includes(
                              realm.data.$request_realm! ||
                                realm.data.$request_subrealm!,
                            ),
                          },
                        )}
                      >
                        <div
                          onClick={() =>
                            setRealmId((prev) => {
                              if (
                                prev.includes(
                                  realm.data.$request_realm! ||
                                    realm.data.$request_subrealm!,
                                )
                              ) {
                                return prev.filter(
                                  (r) =>
                                    r !== realm.data.$request_realm! &&
                                    r !== realm.data.$request_subrealm!,
                                );
                              }

                              return [
                                ...prev,
                                realm.data.$request_realm! ||
                                  realm.data.$request_subrealm!,
                              ];
                            })
                          }
                          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-card"
                        >
                          {renderIndexerPreview({
                            atomicalId: realm.atomical_id,
                            subtype: "realm",
                            payload: {
                              realm:
                                realm.data.$request_realm ||
                                realm.data.$request_subrealm,
                            },
                          })}
                          <div className=" absolute left-2 top-2 rounded-md bg-theme px-2 py-1 text-xs">
                            {realm.data.$request_realm ||
                              realm.data.$request_subrealm}
                          </div>
                          {realmId.includes(
                            realm.data.$request_realm! ||
                              realm.data.$request_subrealm!,
                          ) && (
                            <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-theme">
                              <Check className="h-full w-full text-white" />
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </FormItem>
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              <div>Wallet</div>
              <div
                onClick={() => setWalletDialogOpen(true)}
                className="h-4 w-4 cursor-pointer rounded-md bg-theme"
              >
                <Plus className="h-full w-full text-white" />
              </div>
            </FormLabel>
            <div className="flex flex-col space-y-2 rounded-md bg-card p-4">
              {wallets.length === 0
                ? "No wallets added"
                : wallets.map((w) => (
                    <div
                      key={w.address}
                      className="flex items-center justify-between space-x-2"
                    >
                      <div>{w.name}</div>
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <div className="grid grid-cols-1 truncate">
                          {formatAddress(w.address, 6)}
                        </div>
                        <div
                          onClick={() =>
                            setWallets(
                              wallets.filter(
                                (wallet) => wallet.address !== w.address,
                              ),
                            )
                          }
                          className="h-4 w-4 shrink-0 cursor-pointer"
                        >
                          <X className="h-full w-full text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </FormItem>
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              <div>Link</div>
              <div
                onClick={() => setLinksDialogOpen(true)}
                className="h-4 w-4 cursor-pointer rounded-md bg-theme"
              >
                <Plus className="h-full w-full text-white" />
              </div>
            </FormLabel>
            <div className="flex flex-col space-y-2 rounded-md bg-card p-4">
              {links.length === 0
                ? "No links added"
                : links.map((l) => (
                    <div
                      key={l.url}
                      className="flex items-center justify-between space-x-2"
                    >
                      <div className="flex items-center space-x-2">
                        <div>{l.type}</div>
                        <div>{l.name}</div>
                      </div>
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <div className="grid grid-cols-1 truncate">{l.url}</div>
                        <div
                          onClick={() =>
                            setLinks(links.filter((link) => link.url !== l.url))
                          }
                          className="h-4 w-4 shrink-0 cursor-pointer"
                        >
                          <X className="h-full w-full text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </FormItem>
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
        </div>
        <Button
          disabled={loading}
          type="submit"
          className="flex w-full items-center justify-center"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Next"}
        </Button>
        <WalletInputModal
          open={walletDialogOpen}
          onOpenChange={setWalletDialogOpen}
          onSuccess={(wallet) => {
            if (wallets.find((w) => w.address === wallet.address)) return;

            setWallets((prev) => [...prev, wallet]);
          }}
        />
        <LinkInputModal
          open={linksDialogOpen}
          onOpenChange={setLinksDialogOpen}
          onSuccess={(link) => {
            if (links.find((l) => l.url === link.url)) return;

            setLinks((prev) => [...prev, link]);
          }}
        />
      </form>
    </Form>
  );
};

const WalletInputModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (wallet: { name: string; address: string }) => void;
}> = ({ open, onOpenChange, onSuccess }) => {
  const { isMobile } = useMediaQuery();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
      >
        <DrawerContent className="space-y-4 px-4 pb-8">
          <DrawerHeader>Add Wallet</DrawerHeader>
          <div className="w-full space-y-4">
            <div className="space-y-2">
              <div>Name</div>
              <div className="relative flex items-center">
                <Input
                  className="pr-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <X
                  onClick={() => setName("")}
                  className={cn(
                    "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                    {
                      hidden: !name,
                    },
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div>Address</div>
              <div className="relative flex items-center">
                <Input
                  className="pr-10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <X
                  onClick={() => setAddress("")}
                  className={cn(
                    "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                    {
                      hidden: !address,
                    },
                  )}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              onSuccess({ name, address });
              onOpenChange(false);
            }}
          >
            Add
          </Button>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>Add Wallet</DialogHeader>
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <div>Name</div>
            <div className="relative flex items-center">
              <Input
                className="pr-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <X
                onClick={() => setName("")}
                className={cn(
                  "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                  {
                    hidden: !name,
                  },
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div>Address</div>
            <div className="relative flex items-center">
              <Input
                className="pr-10"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <X
                onClick={() => setAddress("")}
                className={cn(
                  "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                  {
                    hidden: !address,
                  },
                )}
              />
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            onSuccess({ name, address });
            onOpenChange(false);
          }}
        >
          Add
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const LinkInputModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (link: { type: string; name: string; url: string }) => void;
}> = ({ open, onOpenChange, onSuccess }) => {
  const { isMobile } = useMediaQuery();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("");

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
      >
        <DrawerContent className="space-y-4 px-4 pb-8">
          <DrawerHeader>Add Wallet</DrawerHeader>
          <div className="w-full space-y-4">
            <div className="space-y-2">
              <div>Name</div>
              <div className="relative flex items-center">
                <Input
                  className="pr-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <X
                  onClick={() => setName("")}
                  className={cn(
                    "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                    {
                      hidden: !name,
                    },
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div>Url</div>
              <div className="relative flex items-center">
                <Input
                  className="pr-10"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <X
                  onClick={() => setUrl("")}
                  className={cn(
                    "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                    {
                      hidden: !url,
                    },
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div>Type</div>
              <div className="relative flex items-center">
                <Input
                  className="pr-10"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                />
                <X
                  onClick={() => setType("")}
                  className={cn(
                    "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                    {
                      hidden: !type,
                    },
                  )}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              onSuccess({ name, url, type });
              onOpenChange(false);
            }}
          >
            Add
          </Button>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>Add Wallet</DialogHeader>
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <div>Name</div>
            <div className="relative flex items-center">
              <Input
                className="pr-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <X
                onClick={() => setName("")}
                className={cn(
                  "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                  {
                    hidden: !name,
                  },
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div>Url</div>
            <div className="relative flex items-center">
              <Input
                className="pr-10"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <X
                onClick={() => setUrl("")}
                className={cn(
                  "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                  {
                    hidden: !url,
                  },
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div>Type</div>
            <div className="relative flex items-center">
              <Input
                className="pr-10"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
              <X
                onClick={() => setType("")}
                className={cn(
                  "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                  {
                    hidden: !type,
                  },
                )}
              />
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            onSuccess({ name, url, type });
            onOpenChange(false);
          }}
        >
          Add
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default MinMintProfileForm;
