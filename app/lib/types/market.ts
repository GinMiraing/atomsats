export type OfferSummary = {
  id: number;
  lister: string;
  atomicalId: string;
  atomicalNumber: number;
  type: "realm" | "dmitem";
  price: number;
  realm: string;
  dmitem: string;
  container: string;
};

export type OrderSummary = {
  id: number;
  lister: string;
  itemReceiver: string;
  atomicalId: string;
  atomicalNumber: number;
  type: "realm" | "dmitem";
  price: number;
  tx: string;
  createAt: number;
  realm: string;
};

export type RealmItemSummary = {
  id: number;
  atomicalId: string;
  atomicalNumber: number;
  name: string;
  mintTime: number;
};

export type ContainerItemSummary = {
  id: number;
  atomicalId: string;
  atomicalNumber: number;
  dmitem: string;
  mintTime: number;
};

export type RealmMarketStates = {
  floorPrice: number;
  listings: number;
  sales1Day: number;
  volume1Day: number;
  volume7Day: number;
  volumeTotal: number;
};

export type CollectionMarketStates = {
  atomicalId: string;
  atomicalNumber: number;
  container: string;
  name: string;
  deployTime: number;
  itemCount: number;
  mintedCount: number;
  holders: number;
  iconUrl: string;
  rank: number;
  floorPrice: number;
  listings: number;
  sales1Day: number;
  volume1Day: number;
  volume7Day: number;
  volumeTotal: number;
};
