import { Outlet, useLocation, useNavigate } from "@remix-run/react";

import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";

export default function Market() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Tabs
        value={pathname.startsWith("/market/realm") ? "realm" : "collections"}
        className="w-full"
        onValueChange={(value) => {
          navigate(`/market/${value}`);
        }}
      >
        <TabsList className="flex items-center justify-center space-x-4">
          <TabsTrigger
            className="text-lg text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="realm"
          >
            Realm
          </TabsTrigger>
          <TabsTrigger
            className="text-lg text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="collections"
          >
            Collections
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  );
}
