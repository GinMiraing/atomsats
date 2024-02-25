import { networks } from "bitcoinjs-lib";
import { useEffect, useState } from "react";

import { getElectrumClient } from "@/lib/apis/atomical";
import { AtomicalPreviewItem } from "@/lib/types";

import AtomicalPreview from "@/components/AtomicalPreview";

export default function Explorer() {
  const electrumClient = getElectrumClient(networks.bitcoin);

  const [atomicals, setAtomicals] = useState<AtomicalPreviewItem[]>([]);

  const fetchAtomicals = async () => {
    const { result } = await electrumClient.atomicalsList(20, -1, false);

    setAtomicals(
      result.map((atomical) => {
        const atomicalInfo: AtomicalPreviewItem = {
          atomical_id: atomical["atomical_id"],
          atomical_number: atomical["atomical_number"],
          type: atomical["type"],
          subtype: atomical["subtype"],
          timestamp: atomical["mint_info"]["args"]["time"],
        };

        if (
          atomical.subtype === "realm" ||
          atomical.subtype === "request_realm"
        ) {
          atomicalInfo.realm = atomical["$request_realm"];
        }

        if (
          atomical.subtype === "subrealm" ||
          atomical.subtype === "request_subrealm"
        ) {
          atomicalInfo.realm = atomical["$full_realm_name"];
        }

        if (
          atomical.subtype === "container" ||
          atomical.subtype === "request_container"
        ) {
          atomicalInfo.container = atomical["$request_container"];
        }

        if (
          atomical.subtype === "dmitem" ||
          atomical.subtype === "request_dmitem"
        ) {
          const contentType: string =
            atomical["mint_data"]["fields"]["args"]["main"];

          atomicalInfo.contentType = contentType;
          atomicalInfo.content =
            atomical["mint_data"]["fields"][contentType]["$d"];
        }

        if (atomical.type === "FT") {
          atomicalInfo.ticker = atomical["$request_ticker"];
        }

        return atomicalInfo;
      }),
    );
  };

  useEffect(() => {
    fetchAtomicals();
  }, []);

  return (
    <div className="mx-auto grid h-full w-full max-w-screen-lg grid-cols-5 gap-8">
      {atomicals.map((atomical) => (
        <AtomicalPreview
          key={atomical.atomical_id}
          atomical={atomical}
        />
      ))}
    </div>
  );
}
