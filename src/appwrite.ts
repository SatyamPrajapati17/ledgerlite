import { Client } from "appwrite";

const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1")
  .setProject("6ae4f8d4000fe676e1aa");

export { client };

client.ping().then(
  (res) => console.log("✓ Appwrite ping successful:", res),
  (err) => console.warn("Appwrite ping notice (ensure Web Platform localhost is added):", err)
);
