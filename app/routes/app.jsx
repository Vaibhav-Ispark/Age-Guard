import { Outlet, useLoaderData, useLocation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();
  const { search } = useLocation();
  const embeddedHref = (path) => `${path}${search}`;

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href={embeddedHref("/app")}>Dashboard</s-link>
        <s-link href={embeddedHref("/app/settings/design")}>Settings</s-link>
        <s-link href={embeddedHref("/app/analytics")}>Analytics</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
