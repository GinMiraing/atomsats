import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { Dialog, DialogContent, DialogHeader } from "@/components/Dialog";

const MintProcess: React.FC<{
  completedCountState: Record<string, number>;
  open: boolean;
  loading: boolean;
  onCancel: () => void;
}> = ({ completedCountState, loading, open, onCancel }) => {
  const completedCountMap = useMemo(
    () => Object.entries(completedCountState),
    [completedCountState],
  );
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            setAlertOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>{`Building Transaction`}</DialogHeader>
          <div
            className={cn("flex flex-col space-y-4 ", {
              "max-h-[40vh] overflow-y-scroll": completedCountMap.length > 0,
              "h-40": completedCountMap.length === 0,
            })}
          >
            {completedCountMap.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              completedCountMap.map(([index, count]) => (
                <div
                  key={index}
                  className="flex items-center justify-between space-x-2 rounded-md bg-card p-4"
                >
                  <div>Worker {`${parseInt(index) + 1}`}</div>
                  <div>Completed {count}</div>
                </div>
              ))
            )}
          </div>
          <Button
            disabled={loading}
            onClick={() => setAlertOpen(true)}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cancel"}
          </Button>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Minting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel minting? Your progress will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAlertOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancel();
                setAlertOpen(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MintProcess;
