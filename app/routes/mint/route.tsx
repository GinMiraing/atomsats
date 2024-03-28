import { Outlet, useLocation, useNavigate } from "@remix-run/react";

import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";

export default function Mint() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Tabs
        value="realm"
        className="w-full"
      >
        <TabsList className="flex items-center justify-center space-x-4">
          <TabsTrigger
            className="text-lg text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="realm"
          >
            Realm
          </TabsTrigger>
          <TabsTrigger
            disabled
            className="text-lg text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="subrealm"
          >
            Subrealm
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  );
}
