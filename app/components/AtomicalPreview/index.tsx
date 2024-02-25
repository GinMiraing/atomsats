import { AtomicalPreviewItem } from "@/lib/types";

const renderPreview = (atomical: AtomicalPreviewItem) => {
  if (
    atomical.subtype === "realm" ||
    atomical.subtype === "request_realm" ||
    atomical.subtype === "subrealm" ||
    atomical.subtype === "request_subrealm"
  ) {
    return <span>{atomical.realm}</span>;
  } else if (
    atomical.subtype === "container" ||
    atomical.subtype === "request_container"
  ) {
    return <span>{atomical.container}</span>;
  } else if (
    atomical.subtype === "dmitem" ||
    atomical.subtype === "request_dmitem"
  ) {
    const imageBase64 = Buffer.from(atomical.content!, "hex").toString(
      "base64",
    );

    const contentType =
      atomical.contentType === "image.svg"
        ? "image/svg+xml"
        : atomical.contentType!.replace(".", "/");

    return (
      <img
        className="h-full w-full object-cover"
        src={`data:${contentType};base64,${imageBase64}`}
        alt={atomical.atomical_number.toString()}
      />
    );
  } else if (atomical.type === "FT") {
    return <span>{atomical.ticker}</span>;
  }
};

const AtomicalPreview: React.FC<{
  atomical: AtomicalPreviewItem;
}> = ({ atomical }) => {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="relative flex aspect-square w-full items-center justify-center bg-black text-white">
        {renderPreview(atomical)}
        <div className="absolute right-0 top-0 bg-theme px-2 py-1 text-xs font-medium text-white">
          {atomical.type === "FT" ? "FT" : atomical.subtype.toUpperCase()}
        </div>
      </div>
      <div className="p-4">
        <h1 className="text-xl font-bold">{atomical.atomical_number}</h1>
      </div>
    </div>
  );
};

export default AtomicalPreview;
