import { LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = async ({ params }) => {
  const { container } = params as { container: string };
  return redirect(`/market/collections/${container}/listing`);
};
