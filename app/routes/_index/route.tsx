import Banner from "./components/Banner";
import Filters from "./components/Filters";
import TokenTable from "./components/TokenTable";

export default function Index() {
  return (
    <div className="mx-auto max-w-screen-xl space-y-4 px-4 py-8">
      <Banner />
      <Filters />
      <TokenTable />
    </div>
  );
}
