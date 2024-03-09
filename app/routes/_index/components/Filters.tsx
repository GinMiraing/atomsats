import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";

import { useFilters } from "../hooks/useFilters";
import { useHotTokenList } from "../hooks/useHotTokenList";

const Filters = () => {
  const { market, setMarket, volumeRange, setVolumeRange } = useFilters();
  const { isValidating } = useHotTokenList();

  return (
    <div className="flex items-end justify-between md:items-center">
      <div className="flex h-10 w-full items-center">
        {isValidating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <div className="flex h-full items-center space-x-2">
            <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
            <div className="text-sm text-secondary">LIVE</div>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end justify-end space-x-4 space-y-4 md:flex-row md:items-center md:space-y-0">
        <div className="flex items-center space-x-4">
          <div>Market</div>
          <Select
            defaultValue={market}
            onValueChange={setMarket}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bitatom">Bitatom</SelectItem>
              <SelectItem value="atomicalmarket">Atomical Market</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-4">
          <div>Volume Range</div>
          <Select
            defaultValue={volumeRange}
            onValueChange={setVolumeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="volume range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 DAY</SelectItem>
              <SelectItem value="7d">7 DAYS</SelectItem>
              <SelectItem value="all">ALL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Filters;
