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
