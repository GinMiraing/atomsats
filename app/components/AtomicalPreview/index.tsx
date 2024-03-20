import { cn, formatNumber } from "@/lib/utils";

import PunycodeString from "../PunycodeString";

export const renderAddressPreview = (atomical: {
  subtype: string;
  atomicalId: string;
  payload: {
    realm?: string;
    subrealm?: string;
    ticker?: string;
    amount?: number;
    arcs?: boolean;
    container?: string;
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
  } else if (atomical.payload.arcs) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="text-2xl">Arcs</div>
        <div className="text-lg">{formatNumber(1000)}</div>
      </div>
    );
  } else if (["container", "request_container"].includes(atomical.subtype)) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="text-2xl">
          <PunycodeString children={atomical.payload.container || ""} />
        </div>
      </div>
    );
  } else {
    return (
      <img
        className="h-full w-full"
        loading="lazy"
        src={`/api/image/${atomical.atomicalId}`}
        alt={atomical.atomicalId}
      />
    );
  }
};

export const renderIndexerPreview = (atomical: {
  subtype: string;
  atomicalId: string;
  payload: {
    realm?: string;
    ticker?: string;
    container?: string;
    arcs?: boolean;
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
      <div className="flex items-center justify-center">
        <div className="text-2xl">{atomical.payload.ticker}</div>
      </div>
    );
  } else if (["container"].includes(atomical.subtype)) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-2xl">{atomical.payload.container}</div>
      </div>
    );
  } else if (atomical.payload.arcs) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="text-2xl">Arcs</div>
        <div className="text-lg">{formatNumber(1000)}</div>
      </div>
    );
  } else {
    return (
      <img
        className="h-full w-full"
        loading="lazy"
        src={`/api/image/${atomical.atomicalId}`}
        alt={atomical.atomicalId}
      />
    );
  }
};
