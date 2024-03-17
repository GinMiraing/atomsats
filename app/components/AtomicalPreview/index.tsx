import { AtomicalPreviewItem } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

import PunycodeString from "../PunycodeString";

export const renderPreview = (atomical: {
  subtype: string;
  atomicalId: string;
  payload: {
    realm?: string;
    ticker?: string;
    amount?: number;
  };
}) => {
  if (
    ["realm", "request_realm", "subrealm", "request_subrealm"].includes(
      atomical.subtype,
    )
  ) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="text-2xl">
          <PunycodeString children={atomical.payload.realm || ""} />
        </div>
        <div
          className={cn("text-sm", {
            hidden:
              !atomical.payload.realm ||
              !atomical.payload.realm.startsWith("xn--"),
          })}
        >
          {atomical.payload.realm}
        </div>
      </div>
    );
  } else if (["decentralized"].includes(atomical.subtype)) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="text-2xl">{atomical.payload.ticker}</div>
        <div className="text-lg">
          {formatNumber(atomical.payload.amount || 0)}
        </div>
      </div>
    );
  } else {
    return (
      <img
        className="h-full w-full object-cover"
        src={`/api/image/${atomical.atomicalId}`}
        alt={atomical.atomicalId}
      />
    );
  }
};
