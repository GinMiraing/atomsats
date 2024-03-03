import AxiosInstance from "@/lib/axios";

const BaseUrl = "https://bitatom.io/api/trpc";

export const getTokenKlineInBitatom = async (token: string) => {
  const resp = await AxiosInstance.get<{
    result: {
      data: {
        json: {
          time: number;
          avgPrice: number;
          totalVolume: number;
          priceIncreased: boolean;
        }[];
      };
    };
  }>(`${BaseUrl}/analytics.queryTokenHistoricalPrices`, {
    params: {
      input: JSON.stringify({ json: { ticker: token, limit: 10 } }),
    },
  });

  return resp.data.result.data.json;
};

export const getTokenStatsInBitatom = async (token: string) => {
  const resp = await AxiosInstance.get<{
    result: {
      data: {
        json: {
          floorPrice: number;
          listings: number;
          sells_24h: number;
          market_cap: number;
          volume_24h: number;
          volume_7d: number;
          volume_total: number;
        };
      };
    };
  }>(`${BaseUrl}/token.getToken`, {
    params: {
      input: JSON.stringify({ json: { ticker: token } }),
    },
  });

  return resp.data.result.data.json;
};
