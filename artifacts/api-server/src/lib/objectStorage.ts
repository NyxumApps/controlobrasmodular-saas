import { Storage, type File } from "@google-cloud/storage";
import { pipeline } from "node:stream/promises";
import { Transform, type Readable } from "node:stream";

const SIDECAR = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit", subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`, type: "external_account",
    credential_source: { url: `${SIDECAR}/credential`, format: { type: "json", subject_token_field_name: "access_token" } },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function privateDir() {
  const value = process.env.PRIVATE_OBJECT_DIR;
  if (!value) throw new Error("PRIVATE_OBJECT_DIR is not configured");
  return value;
}

function parse(path: string) {
  const parts = path.replace(/^\/+/, "").split("/");
  if (parts.length < 2) throw new Error("Invalid object path");
  return { bucket: parts[0], name: parts.slice(1).join("/") };
}

export function objectFile(objectPath: string): File {
  if (!objectPath.startsWith("/objects/uploads/")) throw new Error("Invalid object path");
  const { bucket, name } = parse(`${privateDir().replace(/\/$/, "")}/${objectPath.slice("/objects/".length)}`);
  return storage.bucket(bucket).file(name);
}

export async function uploadObject(file: File, source: Readable, contentType: string, expectedSize: number) {
  let received = 0;
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      callback(received > expectedSize ? new Error("Upload exceeds declared size") : undefined, chunk);
    },
  });
  try {
    await pipeline(source, limiter, file.createWriteStream({
      resumable: false,
      validation: "crc32c",
      metadata: { contentType },
    }));
    if (received !== expectedSize) throw new Error("Upload size does not match declaration");
  } catch (error) {
    await file.delete({ ignoreNotFound: true }).catch(() => undefined);
    throw error;
  }
}

export async function streamObject(file: File) {
  const [metadata] = await file.getMetadata();
  return {
    stream: file.createReadStream(),
    contentType: String(metadata.contentType || "application/octet-stream"),
    size: metadata.size ? String(metadata.size) : undefined,
  };
}