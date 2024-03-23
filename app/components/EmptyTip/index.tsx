import { cn } from "@/lib/utils";

const EmptyTip: React.FC<{
  border?: boolean;
}> = ({ border }) => {
  return (
    <div
      className={cn("flex h-80 w-full items-center justify-center rounded-md", {
        border: border,
      })}
    >
      <div className="text-2xl font-bold">No Item Found</div>
    </div>
  );
};

export default EmptyTip;
