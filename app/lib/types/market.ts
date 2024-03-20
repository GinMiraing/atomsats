export type OfferSummary = {
  id: number;
  lister: string;
  atomicalId: string;
  atomicalNumber: number;
  type: "realm" | "dmitem";
  price: number;
  createAt: number;
  realm?: string;
  dmitem?: string;
  container?: string;
};
