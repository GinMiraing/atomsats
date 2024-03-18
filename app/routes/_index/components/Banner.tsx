import { useNavigate } from "@remix-run/react";

const Banner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-80 w-full flex-col items-center justify-center space-y-6">
      <div className="text-4xl font-bold">AtomSats</div>
      <div className="text-sm">
        Buy & Mint & Transfer & Deploy & Explore ARC20s more conveniently
      </div>
      <div
        onClick={() => navigate("/market")}
        className="group relative cursor-pointer overflow-hidden rounded-md border bg-transparent px-4 py-2 transition-colors group-hover:border-theme-hover"
      >
        <div className="absolute left-0 top-0 z-0 h-full w-full max-w-0 bg-theme transition-all group-hover:max-w-full"></div>
        <div className="relative z-10 text-xl font-bold">Go To Market</div>
      </div>
    </div>
  );
};

export default Banner;
