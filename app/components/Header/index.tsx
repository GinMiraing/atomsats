import { useLocation, useNavigate } from "@remix-run/react";
import {
  Compass,
  Fuel,
  Link2,
  Link2Off,
  Menu,
  Pickaxe,
  Store,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useGasFee } from "@/lib/hooks/useGasFee";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn, formatAddress } from "@/lib/utils";

import { Button } from "../Button";
import CopyButton from "../CopyButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../DropdownMenu";
import { Sheet, SheetContent } from "../Sheet";
import { useWallet } from "../Wallet/hooks";

const Navigations = [
  {
    name: "Market",
    link: "/market",
    icon: <Store className="h-6 w-6" />,
    disable: false,
  },
  {
    name: "Mint",
    link: "/mint",
    icon: <Pickaxe className="h-6 w-6" />,
    disable: true,
  },
  {
    name: "Explorer",
    link: "/explorer",
    icon: <Compass className="h-6 w-6" />,
    disable: false,
  },
];

const Header: React.FC = () => {
  const { account, setModalOpen, disconnect } = useWallet();
  const { isMobile } = useMediaQuery();
  const nagigate = useNavigate();
  const { pathname } = useLocation();
  const { data: gasFee, mutate: refreshGasFee } = useGasFee();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [avgGasFee, setAvgGasFee] = useState(0);

  useEffect(() => {
    if (!gasFee) return;

    const avg = gasFee.find((item) => item.title === "Medium Priority");

    if (avg) {
      setAvgGasFee(avg.value);
    }
  }, [gasFee]);

  return (
    <header className="fixed left-0 top-0 z-10 flex h-20 w-full items-center justify-between bg-secondary px-4 shadow">
      <div className="flex items-center space-x-10">
        <div
          className="flex cursor-pointer items-center space-x-3 text-primary transition-colors hover:text-theme"
          onClick={() => nagigate("/")}
        >
          <img
            src="/icons/logo.svg"
            alt="atomical utils"
          />
          <div className="text-xl font-bold">AtomSats</div>
        </div>
        <div className="hidden items-center space-x-4 text-xl md:flex">
          {Navigations.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                if (!item.disable) {
                  nagigate(item.link);
                }
              }}
              className={cn("transition-colors", {
                "text-theme": pathname.startsWith(item.link) && !item.disable,
                "cursor-not-allowed text-secondary": item.disable,
                "cursor-pointer hover:text-theme": !item.disable,
              })}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <Fuel className="h-5 w-5" />
          <div className="text-sm">{avgGasFee} sat/vB</div>
        </div>
        {!account && !isMobile && (
          <Button onClick={() => setModalOpen(true)}>Connect</Button>
        )}
        {account && !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="">
                <Wallet className="mr-2 h-4 w-4" />
                {formatAddress(account.address, 6)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => nagigate(`/address/${account.address}`)}
              >
                My Assets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => disconnect()}>
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Menu
          className="h-5 w-5 cursor-pointer text-primary transition-colors hover:text-theme md:hidden"
          onClick={() => setSheetOpen(!sheetOpen)}
        />
      </div>
      <Sheet
        open={isMobile && sheetOpen}
        onOpenChange={setSheetOpen}
      >
        <SheetContent className="space-y-6 pt-12">
          <div className="border-b py-2 text-2xl font-medium">Account</div>
          <div className="space-y-3">
            {account && (
              <>
                <div className="flex items-center justify-between">
                  <div>{formatAddress(account.address, 6)}</div>
                  <CopyButton text={account.address} />
                </div>
                <div
                  onClick={() => nagigate(`/address/${account.address}`)}
                  className="flex w-full cursor-pointer items-center space-x-3 rounded-lg bg-secondary p-6 text-primary transition-colors hover:bg-theme hover:text-white"
                >
                  <Wallet className="h-6 w-6" />
                  <span className="text-xl">My Assets</span>
                </div>
                <div
                  onClick={() => disconnect()}
                  className="flex w-full cursor-pointer items-center space-x-3 rounded-lg bg-secondary p-6 text-primary transition-colors hover:bg-theme hover:text-white"
                >
                  <Link2Off className="h-6 w-6" />
                  <span className="text-xl">Disconnect</span>
                </div>
              </>
            )}
            {!account && (
              <div
                onClick={() => setModalOpen(true)}
                className="flex w-full cursor-pointer items-center space-x-3 rounded-lg bg-secondary p-6 text-primary transition-colors hover:bg-theme hover:text-white"
              >
                <Link2 className="h-6 w-6" />
                <span className="text-xl">Connect</span>
              </div>
            )}
          </div>
          <div className="border-b py-2 text-2xl font-medium">Menu</div>
          <div className="space-y-3">
            {Navigations.map((item) => (
              <div
                key={item.name}
                onClick={() => nagigate(item.link)}
                className="flex w-full cursor-pointer items-center space-x-3 rounded-lg bg-secondary p-6 text-primary transition-colors hover:bg-theme hover:text-white"
              >
                {item.icon}
                <span className="text-xl">{item.name}</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;
