export type AccountAtomical = {
  atomicalId: string;
  atomicalNumber: number;
  type: string;
  subtype: string;
  isArcs: boolean;
  parentRealm?: string;
  requestFullRealmName?: string;
  requestSubrealm?: string;
  parentContainer?: string;
  parentContainerName?: string;
  requestDmitem?: string;
  requestRealm?: string;
  requestTicker?: string;
  listed?: {
    price: number;
    receiver: string;
  };
};
