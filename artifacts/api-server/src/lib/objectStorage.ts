import { del, get, head, put } from "@vercel/blob";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";

export type StoredObject = {
  name: string;
  exists(): Promise<[boolean]>;
  getMetadata(): Promise<[{ size?: string | number; contentType?: string }]>
  delete(options?: { ignoreNotFound?: boolean }): Promise<unknown>;
};

export function objectFile(objectPath: string): StoredObject {
  if (!objectPath.startsWith("/objects/uploads/")) throw new Error("Invalid object path");
  const name = objectPath.slice("/objects/".length);
  if (name.includes("..")) throw new Error("Invalid object path");

  return {
    name,
    async exists() {
      try {
        await head(name);
        return [true];
      } catch {
        return [false];
      }
    },
    async getMetadata() {
      const metadata = await head(name);
      return [{ size: metadata.size, contentType: metadata.contentType }];
    },
    async delete(options) {
      try {
        await del(name);
      } catch (error) {
        if (!options?.ignoreNotFound) throw error;
      }
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
  const collector = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });
  await pipeline(source, limiter, collector);
  if (received !== expectedSize) throw new Error("Upload size does not match declaration");

  await put(file.name, Buffer.concat(chunks), {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: false,
  });
}

export async function streamObject(file: StoredObject) {
  const result = await get(file.name, { access: "private" });
  if (!result || result.statusCode !== 200) throw new Error("Stored object not found");
  return {
    stream: Readable.fromWeb(result.stream),
    contentType: result.blob.contentType || "application/octet-stream",
    size: String(result.blob.size),
  };
}
