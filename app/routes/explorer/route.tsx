import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import { Loader2 } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";

import { useExplorerStatus } from "./hooks/useExplorerStatus";

const tabs = [
  {
    name: "live",
    label: "Live",
    path: "/explorer/live",
  },
  {
    name: "realm",
    label: "Realm",
    path: "/explorer/realm",
  },
  {
    name: "dmitem",
    label: "Dmitem",
    path: "/explorer/dmitem",
  },
];

export default function Explorer() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isValidating } = useExplorerStatus();

  return (
    <div className="w-full space-y-6">
      <div className="text-2xl font-bold">Explorer</div>
      <Tabs
        defaultValue={pathname.split("/")[2]}
        className="flex items-center justify-between border-b"
      >
        <TabsList className="bg-transparent">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.name}
              className="h-10 bg-transparent text-primary hover:text-theme-hover data-[state=active]:border-b-2 data-[state=active]:border-b-theme data-[state=active]:bg-transparent data-[state=active]:text-theme"
              value={tab.name}
              onClick={() => {
                navigate(tab.path);
              }}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center">
          {isValidating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
          )}
        </div>
      </Tabs>
      <Outlet />
    </div>
  );
}
