import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { getElectrumClient } from "@/lib/apis/atomical";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useWallet } from "@/lib/hooks/useWallet";
import { formatAddress } from "@/lib/utils";

import { Button } from "../Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../Dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../Drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../DropdownMenu";

const Header: React.FC = () => {
  const { account, disconnect, network } = useWallet();
  const { isMobile } = useMediaQuery();

  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const electrumClient = getElectrumClient(network);

  const test = async () => {
    const result = await electrumClient.atomicalsList(20, 187761, true);
    // const result = await electrumClient.atomicalsByAddress(
    //   "bc1p0pr77wpaqeg8d7ln7txddnhsrnt0sv66j6re7f7w9cntj8rwfw4shwd0un",
    // );

    console.log(result);
  };

  useEffect(() => {
    test();
  }, [electrumClient, account]);

  return (
    <div className="fixed left-0 top-0 z-10 flex h-20 w-full items-center justify-between bg-primary px-4 shadow">
      <a
        className="text-2xl text-primary transition-colors hover:text-theme"
        href="/"
      >
        Atomical Utils
      </a>
      {!account && (
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
            <DropdownMenuItem onClick={() => disconnect()}>
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
    </div>
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
