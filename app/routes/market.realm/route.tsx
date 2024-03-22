import { zodResolver } from "@hookform/resolvers/zod";
import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toASCII } from "tr46";
import { z } from "zod";

import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { cn, formatNumber } from "@/lib/utils";

import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/Form";
import { Input } from "@/components/Input";
import { Sheet, SheetContent } from "@/components/Sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";

import { useRealmFilters } from "./hooks/useRealmFilters";

const FormSchema = z.object({
  name: z.string(),
  minLength: z.string(),
  maxLength: z.string(),
  minPrice: z.string(),
  maxPrice: z.string(),
  punycode: z.boolean(),
});

type FormSchemaType = z.infer<typeof FormSchema>;

export default function MarketRealm() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { filterOpen, filters, setFilterOpen, setFilters } = useRealmFilters();
  const { updateSearchParams } = useSetSearch();

  const splitValue = useMemo(() => pathname.split("/")[3], [pathname]);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: filters,
  });

  useEffect(() => {
    const listener = form.watch((value, { type, name }) => {
      if (type === "valueChange" || "change") {
        updateSearchParams(
          { page: "" },
          {
            action: "push",
            scroll: false,
          },
        );

        setFilters({
          name: value.name
            ? value.name.startsWith("xn--")
              ? value.name
              : toASCII(value.name)
            : "",
          minLength: value.minLength || "",
          maxLength: value.maxLength || "",
          minPrice: value.minPrice || "",
          maxPrice: value.maxPrice || "",
          punycode: value.punycode || false,
        });
      }
    });
    return () => listener.unsubscribe();
  }, [form.watch]);

  return (
    <div className="w-full space-y-6">
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-6 lg:gap-6">
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Floor Price</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div>{formatNumber(1000000)}</div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Listings</div>
          <div>{formatNumber(100)}</div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Sales(24H)</div>
          <div>{formatNumber(100)}</div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Volume(24H)</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div>{formatNumber(1000000)}</div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Volume(7D)</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div>{formatNumber(1000000)}</div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Volume Total</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div>{formatNumber(1000000)}</div>
          </div>
        </div>
      </div>
      <Tabs
        value={splitValue}
        className="border-b"
        onValueChange={(value) => {
          navigate(`/market/realm/${value}`, {
            preventScrollReset: true,
          });
        }}
      >
        <TabsList>
          <TabsTrigger
            className="text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="listing"
          >
            Listing
          </TabsTrigger>
          <TabsTrigger
            className="text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="history"
          >
            history
          </TabsTrigger>
          <TabsTrigger
            className="text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="items"
          >
            items
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
      <Sheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
      >
        <SheetContent className="space-y-6 pt-12">
          <div className="border-b py-2 text-2xl font-medium">
            Realm Filters
          </div>
          <Form {...form}>
            <form className="space-y-8">
              <div className="space-y-3">
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
                                hidden: !form.watch("name"),
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
                  name="minLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Length</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            className="pr-10"
                            {...field}
                          />
                          <X
                            onClick={() => form.setValue("minLength", "")}
                            className={cn(
                              "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                              {
                                hidden: !form.watch("minLength"),
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
                  name="maxLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Length</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            className="pr-10"
                            {...field}
                          />
                          <X
                            onClick={() => form.setValue("maxLength", "")}
                            className={cn(
                              "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                              {
                                hidden: !form.watch("maxLength"),
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
                  name="minPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Price</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            className="pr-10"
                            {...field}
                          />
                          <X
                            onClick={() => form.setValue("minPrice", "")}
                            className={cn(
                              "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                              {
                                hidden: !form.watch("minPrice"),
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
                  name="maxPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Price</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            className="pr-10"
                            {...field}
                          />
                          <X
                            onClick={() => form.setValue("maxPrice", "")}
                            className={cn(
                              "absolute right-3 h-5 w-5 cursor-pointer text-secondary transition-colors hover:text-theme",
                              {
                                hidden: !form.watch("maxPrice"),
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
                  name="punycode"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 pt-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Punycode( start with "xn--" )</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  onClick={() =>
                    form.reset({
                      name: "",
                      minLength: "",
                      maxLength: "",
                      minPrice: "",
                      maxPrice: "",
                      punycode: false,
                    })
                  }
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
