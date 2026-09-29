import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";
import { storageBucket, supabaseAdmin } from "./supabase";

/**
 * Minimal handle over one object in the private Supabase Storage bucket.
 * Results come as one-element tuples because the attachment routes (and their
 * tests) were written against that shape.
 */
export type StoredObject = {
  name: string;
  exists(): Promise<[boolean]>;
  getMetadata(): Promise<[{ size?: string | number; contentType?: string }]>;
  delete(options?: { ignoreNotFound?: boolean }): Promise<unknown>;
};

const bucket = () => supabaseAdmin().storage.from(storageBucket());

export function objectFile(objectPath: string): StoredObject {
  if (!objectPath.startsWith("/objects/uploads/")) throw new Error("Invalid object path");
  const name = objectPath.slice("/objects/".length);
  if (name.includes("..")) throw new Error("Invalid object path");
  return {
    name,
    async exists() {
      const { data, error } = await bucket().exists(name);
      return [!error && data === true];
    },
    async getMetadata() {
      const { data, error } = await bucket().info(name);
      if (error) throw error;
      return [{ size: data.size, contentType: data.contentType }];
    },
    async delete(options) {
      const { error } = await bucket().remove([name]);
      if (error && !options?.ignoreNotFound) throw error;
      return undefined;
    },
  };
}

export async function uploadObject(file: StoredObject, source: Readable, contentType: string, expectedSize: number) {
  let received = 0;
  const chunks: Buffer[] = [];
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      callback(received > expectedSize ? new Error("Upload exceeds declared size") : undefined, chunk);
    },
  });
  // Files are capped at 10 MiB by the route, so buffering keeps the upload atomic.
  const collector = new Writable({
    write(chunk, _encoding, callback) { chunks.push(chunk); callback(); },
  });
  await pipeline(source, limiter, collector);
  if (received !== expectedSize) throw new Error("Upload size does not match declaration");
  const { error } = await bucket().upload(file.name, Buffer.concat(chunks), { contentType, upsert: false });
  if (error) throw error;
}

export async function streamObject(file: StoredObject) {
  const { data, error } = await bucket().download(file.name);
  if (error) throw error;
  return {
    stream: Readable.from(Buffer.from(await data.arrayBuffer())),
    contentType: data.type || "application/octet-stream",
    size: String(data.size),
  };
}
