import { Check, Copy } from "lucide-react";

import useClipboard from "@/lib/hooks/useClipboard";

const CopyButton: React.FC<{
  text: string;
}> = ({ text }) => {
  const { copyToClipboard, success } = useClipboard();

  const handleCopy = async () => {
    await copyToClipboard(text);
  };

  if (success) {
    return (
      <div className="flex rounded-md bg-primary p-2 text-green-400 transition-colors hover:bg-secondary">
        <Check className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex cursor-pointer rounded-md bg-primary p-2 text-primary transition-colors hover:bg-secondary hover:text-theme">
      <Copy
        onClick={() => {
          handleCopy();
        }}
        className="h-5 w-5"
      />
    </div>
  );
};

export default CopyButton;
