import { useNavigate } from "@remix-run/react";
import dayjs from "dayjs";

import { OrderSummary } from "@/lib/types/market";
import { formatAddress, formatNumber, satsToBTC } from "@/lib/utils";

import PunycodeString from "@/components/PunycodeString";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Table";

const HistoryTable: React.FC<{
  orders: OrderSummary[];
}> = ({ orders }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-80 w-full">
      <Table>
        <TableHeader>
          <TableRow className="relative bg-secondary">
            <TableHead className="sticky left-0 bg-secondary">Realm</TableHead>
            <TableHead>Atomical Number</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Lister</TableHead>
            <TableHead>Receiver</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.tx}
              className="group relative"
            >
              <TableCell className="sticky left-0 bg-primary transition-colors group-hover:bg-secondary">
                <div className="flex items-center space-x-2">
                  <PunycodeString children={order.realm} />
                </div>
              </TableCell>
              <TableCell>
                <div
                  onClick={() => {
                    navigate(`/atomical/${order.atomicalNumber}`);
                  }}
                  className="cursor-pointer text-base transition-colors hover:text-theme-hover"
                >
                  #{order.atomicalNumber}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2 text-base">
                  <img
                    src="/icons/btc.svg"
                    alt="btc"
                  />
                  <div>
                    {formatNumber(
                      parseFloat(satsToBTC(order.price, { digits: 8 })),
                      {
                        precision: 6,
                      },
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <a
                  href={`https://mempool.space/address/${order.lister}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base transition-colors hover:text-theme-hover"
                >
                  {formatAddress(order.lister, 6)}
                </a>
              </TableCell>
              <TableCell>
                <a
                  href={`https://mempool.space/address/${order.itemReceiver}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base transition-colors hover:text-theme-hover"
                >
                  {formatAddress(order.itemReceiver, 6)}
                </a>
              </TableCell>
              <TableCell>
                <a
                  href={`https://mempool.space/tx/${order.tx}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base transition-colors hover:text-theme-hover"
                >
                  {formatAddress(order.tx, 8)}
                </a>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {dayjs.unix(order.createAt).fromNow()}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HistoryTable;
