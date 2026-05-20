/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { useFetcher, useLocation } from "react-router";

export function UploadField({ label, value, onChange }) {
  const fetcher = useFetcher();
  const { search } = useLocation();
  const inputRef = useRef(null);

  useEffect(() => {
    if (fetcher.data?.url) {
      onChange(fetcher.data.url);
      window.shopify?.toast?.show("Image uploaded to Shopify Files");
    }
  }, [fetcher.data, onChange]);

  function upload(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    fetcher.submit(formData, {
      action: `/app/upload${search}`,
      encType: "multipart/form-data",
      method: "POST",
    });
  }

  return (
    <div className="ag-field">
      <span className="ag-label">{label}</span>
      <div
        className="ag-upload"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          upload(event.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          accept="image/*"
          hidden
          type="file"
          onChange={(event) => upload(event.target.files?.[0])}
        />
        <button
          className="ag-btn ag-btn-secondary"
          disabled={fetcher.state !== "idle"}
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          {fetcher.state !== "idle" ? "Uploading..." : "Upload image"}
        </button>
        <span>Drag and drop, or paste a Shopify CDN URL below.</span>
      </div>
      <input
        placeholder="https://cdn.shopify.com/..."
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
