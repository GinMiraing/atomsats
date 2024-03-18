export type OfferSummary = {
  id: number;
  atomicalId: string;
  atomicalNumber: number;
  type: "realm" | "dmitem";
  price: number;
  createAt: number;
  realm?: string;
  dmitem?: string;
  container?: string;
};
