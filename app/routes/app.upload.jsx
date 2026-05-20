import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return { ok: false, error: "No file received" };
  }

  const stagedResponse = await admin.graphql(
    `#graphql
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }`,
    {
      variables: {
        input: [
          {
            filename: file.name,
            mimeType: file.type || "image/png",
            httpMethod: "POST",
            resource: "FILE",
          },
        ],
      },
    },
  );
  const stagedJson = await stagedResponse.json();
  const target = stagedJson.data?.stagedUploadsCreate?.stagedTargets?.[0];

  if (!target) {
    return {
      ok: false,
      error:
        stagedJson.data?.stagedUploadsCreate?.userErrors?.[0]?.message ||
        "Could not prepare upload",
    };
  }

  const uploadData = new FormData();
  for (const parameter of target.parameters) {
    uploadData.append(parameter.name, parameter.value);
  }
  uploadData.append("file", file);
  await fetch(target.url, { method: "POST", body: uploadData });

  const createResponse = await admin.graphql(
    `#graphql
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            alt
            ... on MediaImage {
              image { url }
            }
          }
          userErrors { field message }
        }
      }`,
    {
      variables: {
        files: [
          {
            alt: "Age Guard popup asset",
            contentType: "IMAGE",
            originalSource: target.resourceUrl,
          },
        ],
      },
    },
  );
  const createJson = await createResponse.json();
  const createdFile = createJson.data?.fileCreate?.files?.[0];

  return {
    ok: Boolean(createdFile),
    url: createdFile?.image?.url || target.resourceUrl,
    file: createdFile,
    error: createJson.data?.fileCreate?.userErrors?.[0]?.message,
  };
};
