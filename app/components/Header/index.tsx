import { useLocation, useNavigate } from "@remix-run/react";
import { Compass, Menu, Pickaxe, Store, Wallet } from "lucide-react";
import { useState } from "react";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useWallet } from "@/lib/hooks/useWallet";
import { cn, formatAddress } from "@/lib/utils";

import { Button } from "../Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../Dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../Drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../DropdownMenu";
import { Sheet, SheetContent } from "../Sheet";

const Navigations = [
  {
    name: "Market",
    link: "/",
    icon: <Store className="h-6 w-6" />,
  },
  {
    name: "Mint",
    link: "/mint",
    icon: <Pickaxe className="h-6 w-6" />,
  },
  {
    name: "Explorer",
    link: "/explorer",
    icon: <Compass className="h-6 w-6" />,
  },
];

const Header: React.FC = () => {
  const { account, disconnect } = useWallet();
  const { isMobile } = useMediaQuery();
  const nagigate = useNavigate();
  const { pathname } = useLocation();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-10 flex h-20 w-full items-center justify-between bg-primary px-4 shadow">
      <div className="flex items-center space-x-10">
        <a
          className="flex items-center space-x-3 text-primary transition-colors hover:text-theme"
          href="/"
        >
          <img
            src="/icons/logo.svg"
            alt="atomical utils"
          />
          <div className="text-xl font-bold">Atomical Utils</div>
        </a>
        <div className="hidden items-center space-x-4 text-xl md:flex">
          {Navigations.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className={cn("transition-colors hover:text-theme", {
                "text-theme":
                  item.name === "Analysis"
                    ? pathname === "/"
                    : pathname.startsWith(item.link),
              })}
            >
              {item.name}
            </a>
          ))}
        </div>
      </div>

      {/* {!account && (
        <Button onClick={() => setWalletModalOpen(true)}>Connect</Button>
      )}
      {account && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="border bg-primary text-primary transition-colors hover:border-theme hover:bg-secondary hover:text-theme">
              <Wallet className="mr-2 h-4 w-4" />
              {formatAddress(account)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => nagigate(`/address/${account}`)}>
              My Items
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => disconnect()}>
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )} */}
      {isMobile ? (
        <MobileWalletModal
          open={walletModalOpen}
          setOpen={setWalletModalOpen}
        />
      ) : (
        <DesktopWalletModal
          open={walletModalOpen}
          setOpen={setWalletModalOpen}
        />
      )}
      <Menu
        className="h-5 w-5 cursor-pointer text-primary transition-colors hover:text-theme md:hidden"
        onClick={() => setSheetOpen(!sheetOpen)}
      />
      <Sheet
        open={isMobile && sheetOpen}
        onOpenChange={setSheetOpen}
      >
        <SheetContent className="pt-12">
          <div className="border-b py-2 text-2xl font-medium">Menu</div>
          <div className="mt-6 space-y-2">
            {Navigations.map((item) => (
              <a
                key={item.name}
                href={item.link}
                className="flex w-full items-center space-x-3 rounded-lg bg-secondary p-6 text-primary transition-colors hover:bg-theme hover:text-white"
              >
                {item.icon}
                <span className="text-xl">{item.name}</span>
              </a>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

const MobileWalletModal: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ open, setOpen }) => {
  const { connect } = useWallet();

  const handleConnect = (wallet: "unisat" | "wizz") => {
    try {
      connect(wallet);
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Connect Wallet</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col space-y-2 px-4 pb-4">
          <div
            onClick={() => handleConnect("unisat")}
            className="group flex w-full cursor-pointer items-center space-x-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-theme"
          >
            <img
              className="h-10 w-10"
              src="/icons/wallet-unisat.svg"
              alt="unisat wallet"
            />
            <div className="text-lg transition-colors group-hover:text-white">
              Unisat Wallet
            </div>
          </div>
          <div
            onClick={() => handleConnect("wizz")}
            className="group flex w-full cursor-pointer items-center space-x-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-theme"
          >
            <img
              className="h-10 w-10"
              src="/icons/wallet-wizz.svg"
              alt="wizz wallet"
            />
            <div className="text-lg transition-colors group-hover:text-white">
              Wizz Wallet
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const DesktopWalletModal: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ open, setOpen }) => {
  const { connect } = useWallet();

  const handleConnect = (wallet: "unisat" | "wizz") => {
    try {
      connect(wallet);
      setOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-2">
          <div
            onClick={() => handleConnect("unisat")}
            className="group flex w-full cursor-pointer items-center space-x-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-theme"
          >
            <img
              className="h-10 w-10"
              src="/icons/wallet-unisat.svg"
              alt="unisat wallet"
            />
            <div className="text-lg transition-colors group-hover:text-white">
              Unisat Wallet
            </div>
          </div>
          <div
            onClick={() => handleConnect("wizz")}
            className="group flex w-full cursor-pointer items-center space-x-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-theme"
          >
            <img
              className="h-10 w-10"
              src="/icons/wallet-wizz.svg"
              alt="wizz wallet"
            />
            <div className="text-lg transition-colors group-hover:text-white">
              Wizz Wallet
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Header;
