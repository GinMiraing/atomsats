import { useNavigate } from "@remix-run/react";
import { useDebounce } from "@uidotdev/usehooks";
import { networks } from "bitcoinjs-lib";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toASCII } from "tr46";

import { getElectrumClient } from "@/lib/apis/atomical";
import { getTransaction } from "@/lib/apis/mempool";
import AxiosInstance from "@/lib/axios";
import { detectAddressTypeToScripthash } from "@/lib/utils/address-helpers";

import { Input } from "../Input";
import PunycodeString from "../PunycodeString";

const AtomicalSearch: React.FC<{
  searchValue: string;
  setSearchValue: (value: string) => void;
}> = ({ searchValue, setSearchValue }) => {
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const navigate = useNavigate();
  const electrum = getElectrumClient(networks.bitcoin);

  const [searchType, setSearchType] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    {
      tx?: string;
      atomicalNumber?: number;
      realm?: string;
    }[]
  >([]);

  const fetchAtomical = async (atom: string | number) => {
    try {
      setLoading(true);
      const { result } = await electrum.atomicalsGet(atom);
      setSearchType("atomical");
      setResults([
        {
          atomicalNumber: result.atomical_number,
        },
      ]);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTx = async (tx: string) => {
    try {
      setLoading(true);
      const txid = await getTransaction(tx, networks.bitcoin);
      setSearchType("tx");
      setResults([
        {
          tx: txid,
        },
      ]);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealm = async (name: string) => {
    try {
      const encode = name.startsWith("xn--") ? name : toASCII(name);
      const { data: realms } = await AxiosInstance.post<{
        data: {
          atomicalId: string;
          atomicalNumber: number;
          name: string;
        }[];
        error: boolean;
        code: number;
      }>("/api/search/all", {
        realm: encode,
      });

      if (realms.error) {
        setLoading(false);
        return;
      }

      setSearchType("realm");
      setResults(
        realms.data.map((realm) => ({
          atomicalNumber: realm.atomicalNumber,
          realm: realm.name,
        })),
      );
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchType("");
    setSearchValue("");
    setResults([]);
    setLoading(false);
  };

  useEffect(() => {
    if (!debouncedSearchValue) {
      resetSearch();
      return;
    }

    setSearchType("");

    // address
    try {
      detectAddressTypeToScripthash(debouncedSearchValue);
      setSearchType("address");
      return;
    } catch (e) {}

    // tx
    if (debouncedSearchValue.length === 64) {
      fetchTx(debouncedSearchValue);
      return;
    }

    // atomical
    if (
      debouncedSearchValue.length === 66 ||
      Number.isInteger(parseInt(debouncedSearchValue))
    ) {
      fetchAtomical(debouncedSearchValue);
      return;
    }

    fetchRealm(debouncedSearchValue);
  }, [debouncedSearchValue]);

  return (
    <div className="relative flex h-20 w-full flex-col">
      <div className="relative flex h-20 w-full items-center overflow-hidden rounded-xl">
        <Input
          className="w-full rounded-xl px-10"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <div className="absolute left-0 flex h-full w-10 items-center justify-center bg-transparent text-secondary">
          <Search className="h-5 w-5" />
        </div>
        {searchValue && (
          <div
            onClick={() => resetSearch()}
            className="absolute right-4 flex h-full cursor-pointer items-center"
          >
            <X className="h-5 w-5" />
          </div>
        )}
      </div>
      {(searchType || loading) && (
        <div className="absolute left-0 right-0 top-16 max-h-80 w-full space-y-4 overflow-x-hidden overflow-y-scroll rounded bg-secondary p-2 shadow">
          {loading && (
            <div className="flex h-28 w-full items-center justify-center px-3 py-2">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {searchType === "address" && (
            <div
              onClick={() => {
                setSearchType("");
                setSearchValue("");
                navigate(`/address/${searchValue}`);
              }}
              className="grid w-full cursor-pointer grid-cols-1 truncate rounded px-3 py-2 transition-colors hover:bg-secondary"
            >
              {`Address: ${searchValue}`}
            </div>
          )}
          {searchType === "tx" &&
            results.length > 0 &&
            results.map(({ tx }) => (
              <a
                key={tx || ""}
                target="_blank"
                href={`https://mempool.space/tx/${tx || ""}`}
                className="grid w-full cursor-pointer grid-cols-1 truncate rounded px-3 py-2 transition-colors hover:bg-secondary"
              >
                {`Transaction: ${tx}`}
              </a>
            ))}
          {searchType === "atomical" &&
            results.length > 0 &&
            results.map(({ atomicalNumber }) => (
              <div
                key={atomicalNumber || 0}
                onClick={() => {
                  setSearchType("");
                  setSearchValue("");
                  navigate(`/atomical/${atomicalNumber || 0}`);
                }}
                className="grid w-full cursor-pointer grid-cols-1 truncate rounded px-3 py-2 transition-colors hover:bg-secondary"
              >
                {`Atomical Number: #${atomicalNumber || 0}`}
              </div>
            ))}
          {searchType === "realm" &&
            results.length > 0 &&
            results.map(({ atomicalNumber, realm }) => (
              <div
                key={atomicalNumber || 0}
                onClick={() => {
                  setSearchType("");
                  setSearchValue("");
                  navigate(`/atomical/${atomicalNumber || 0}`);
                }}
                className="grid w-full cursor-pointer grid-cols-1 truncate rounded px-3 py-2 transition-colors hover:bg-secondary"
              >
                <PunycodeString children={realm || ""} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AtomicalSearch;
