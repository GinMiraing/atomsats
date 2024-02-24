import { AtomicalPreviewItem } from "@/lib/types";

const AtomicalPreview: React.FC<{
  atomical: AtomicalPreviewItem;
}> = ({ atomical }) => {
  console.log(atomical);

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="flex h-24 w-full items-center justify-center bg-black text-white">
        123
      </div>
      <div className="p-4">
        <h1 className="text-xl font-bold">123</h1>
      </div>
    </div>
  );
};

export default AtomicalPreview;
