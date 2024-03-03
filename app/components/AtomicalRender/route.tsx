import { isCONTAINER, isFT, isREALM } from "@/lib/apis/atomical/type";

import PunycodeString from "../PunycodeString";

const AtomicalRender: React.FC<{
  atomical: {
    type: "FT" | "NFT";
    subtype: string;
    content: string;
    contentType: string;
  };
}> = ({ atomical }) => {
  if (isFT(atomical) || isCONTAINER(atomical)) {
    return <span className="text-xl">{atomical.content}</span>;
  }

  if (isREALM(atomical)) {
    return (
      <div className="flex flex-col items-center justify-center text-xl">
        <span>
          <PunycodeString children={atomical.content} />
        </span>
        {atomical.content.startsWith("xn--") && (
          <span className="mt-2 text-xs opacity-70">{atomical.content}</span>
        )}
      </div>
    );
  }

  if (
    ["jpg", "jpeg", "png", "gif", "svg", "bmp", "tiff", "webp"].includes(
      atomical.contentType,
    )
  ) {
    const base64Data = Buffer.from(atomical.content, "hex").toString("base64");

    return (
      <img
        className="h-full w-full object-fill"
        src={
          atomical.contentType === "svg"
            ? `data:image/svg+xml;base64,${base64Data}`
            : `data:image/${atomical.contentType};base64,${base64Data}`
        }
        alt={atomical.subtype}
      />
    );
  }

  return <span className="text-xl">UNKNOWN DATA</span>;
};

export default AtomicalRender;
