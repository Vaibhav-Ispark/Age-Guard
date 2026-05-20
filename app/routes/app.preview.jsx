import { useState } from "react";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAgeGuardConfig } from "../models/ageGuard.server";
import { LivePreview } from "../components/AgeGuardPreview";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getAgeGuardConfig(session.shop);
};

export default function PreviewPage() {
  const config = useLoaderData();
  const [device, setDevice] = useState("desktop");
  return (
    <div className="ag-admin-page">
      <div className="ag-page-title">
        <div>
          <p className="ag-kicker">Preview</p>
          <h1>Age Guard preview</h1>
        </div>
      </div>
      <LivePreview
        enabled={config.enabled}
        settings={config.settings}
        device={device}
        onDeviceChange={setDevice}
      />
    </div>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
