import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

import Footer from "./components/Footer";
import Header from "./components/Header";
import { Toaster } from "./lib/hooks/useToast";
import { WalletProvider } from "./lib/hooks/useWallet";
import styles from "./tailwind.css";

dayjs.extend(relativeTime);

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles },
];

export const meta: MetaFunction = () => {
  return [
    {
      title:
        "Atomical Utils - Buy & Mint & Transfer & Deploy & Explore ARC20s more conveniently",
    },
    {
      name: "description",
      content:
        "Buy & Mint & Transfer & Deploy & Explore ARC20s more conveniently",
    },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WalletProvider>
          <Header />
          <main className="mt-20">
            <div className="mx-auto max-w-screen-xl px-4 py-8">
              <Outlet />
            </div>
          </main>
          <Footer />
          <Toaster />
        </WalletProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
