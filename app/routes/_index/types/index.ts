export type TokenResponse = {
  id: number;
  atomicalId: string;
  atomicalNumber: number;
  name: string;
  deployTime: number;
  holders: number;
  updateAt: number;
  iconUrl: string;
  mintMode: "fixed" | "perpetual";
  minted: string;
  totalSupply: string;
  market: {
    atomicalmarket: {
      floorPrice: number;
      totalListed: number;
      volume1Day: number;
      volume7Days: number;
      volumeTotal: number;
      sales1Day: number;
      marketCap: number;
    };
    bitatom: {
      floorPrice: number;
      totalListed: number;
      volume1Day: number;
      volume7Days: number;
      volumeTotal: number;
      sales1Day: number;
      marketCap: number;
    };
  };
};
