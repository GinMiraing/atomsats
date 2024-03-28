import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { formatAddress } from "@/lib/utils";

import { Button } from "@/components/Button";
import CopyButton from "@/components/CopyButton";
import { Dialog, DialogContent, DialogHeader } from "@/components/Dialog";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/Drawer";

const Complete: React.FC<{
  open: boolean;
  txHex: {
    commit: string;
    reveal: string;
  };
  txId: {
    commit: string;
    reveal: string;
  };
  onClose: () => void;
}> = ({ open, txHex, txId, onClose }) => {
  const { isMobile } = useMediaQuery();

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            if (txHex.commit || txHex.reveal) return;
            onClose();
          }
        }}
      >
        <DrawerContent className="space-y-4 px-4 pb-8">
          <DrawerHeader>
            {txHex.commit || txHex.reveal ? `Push Failed` : `Push Complete`}
          </DrawerHeader>
          <div className="flex flex-col space-y-4">
            {txHex.commit || txHex.reveal ? (
              <>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="text-sm font-bold">Commit Raw Tx</div>
                    <CopyButton text={txHex.commit} />
                  </div>
                  <div className="max-h-[10vh] overflow-y-scroll break-all rounded-md bg-card px-3 py-2 text-sm text-secondary">
                    {txHex.commit}
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="text-sm font-bold">Reveal Raw Tx</div>
                    <CopyButton text={txHex.reveal} />
                  </div>
                  <div className="max-h-[10vh] overflow-y-scroll break-all rounded-md bg-card px-3 py-2 text-sm text-secondary">
                    {txHex.reveal}
                  </div>
                </div>
                <div className="flex flex-col space-y-2 text-red-500">
                  <div>
                    Please copy the raw txs and push in below link, then refresh
                    this page
                  </div>
                  <a
                    href="https://mempool.space/tx/push"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://mempool.space/tx/push
                  </a>
                </div>
              </>
            ) : null}
            {txId.commit || txId.reveal ? (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="text-sm font-bold">Commit Tx</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-secondary">
                      {formatAddress(txId.commit, 10)}
                    </div>
                    <CopyButton text={txId.commit} />
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="text-sm font-bold">Reveal Tx</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-secondary">
                      {formatAddress(txId.reveal, 10)}
                    </div>
                    <CopyButton text={txId.reveal} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <Button
            disabled={txHex.commit || txHex.reveal ? true : false}
            onClick={() => onClose()}
          >
            Complete
          </Button>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          if (txHex.commit || txHex.reveal) return;
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          {txHex.commit || txHex.reveal ? `Push Failed` : `Push Complete`}
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          {txHex.commit || txHex.reveal ? (
            <>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="text-sm font-bold">Commit Raw Tx</div>
                  <CopyButton text={txHex.commit} />
                </div>
                <div className="max-h-[10vh] overflow-y-scroll break-all rounded-md bg-card px-3 py-2 text-sm text-secondary">
                  {txHex.commit}
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="text-sm font-bold">Reveal Raw Tx</div>
                  <CopyButton text={txHex.reveal} />
                </div>
                <div className="max-h-[10vh] overflow-y-scroll break-all rounded-md bg-card px-3 py-2 text-sm text-secondary">
                  {txHex.reveal}
                </div>
              </div>
              <div className="flex flex-col space-y-2 text-red-500">
                <div>
                  Please copy the raw txs and push in below link, then refresh
                  this page
                </div>
                <a
                  href="https://mempool.space/tx/push"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://mempool.space/tx/push
                </a>
              </div>
            </>
          ) : null}
          {txId.commit || txId.reveal ? (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="text-sm font-bold">Commit Tx</div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-secondary">
                    {formatAddress(txId.commit, 10)}
                  </div>
                  <CopyButton text={txId.commit} />
                </div>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="text-sm font-bold">Reveal Tx</div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-secondary">
                    {formatAddress(txId.reveal, 10)}
                  </div>
                  <CopyButton text={txId.reveal} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <Button
          disabled={txHex.commit || txHex.reveal ? true : false}
          onClick={() => onClose()}
        >
          Complete
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default Complete;
