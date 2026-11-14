// A minimal S3 client: the four operations the worker uses, over plain fetch
// with SigV4 signing (aws4fetch). Path-style addressing, so the same code talks
// to Cloudflare R2 in production and SeaweedFS in the local stack.
//
// This replaced @aws-sdk/client-s3, which only runs on Workers through its
// browser build — selected by the package.json `browser` field, which the Deno
// bundler does not honor — and which was ~140 modules for these four calls.

import { AwsClient } from "aws4fetch";

export type S3Config = {
  /** e.g. https://<account>.r2.cloudflarestorage.com, http://seaweedfs:8333 */
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export class S3Bucket {
  readonly #client: AwsClient;
  readonly #base: string;

  constructor(config: S3Config) {
    this.#client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: "s3",
      region: "auto",
    });
    this.#base = `${config.endpoint.replace(/\/$/, "")}/${config.bucket}`;
  }

  #url(key: string): string {
    return `${this.#base}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  /**
   * GET an object. The Response (body unread) when it exists, null when it
   * does not (404). Any other failure throws.
   */
  async get(key: string): Promise<Response | null> {
    const response = await this.#client.fetch(this.#url(key));
    if (response.status === 404) {
      await response.body?.cancel();
      return null;
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `S3 GET ${key} failed: ${response.status} ${detail.slice(0, 200)}`,
      );
    }
    return response;
  }

  /** Whether an object exists. Any failure other than a 404 throws. */
  async exists(key: string): Promise<boolean> {
    const response = await this.#client.fetch(this.#url(key), {
      method: "HEAD",
    });
    await response.body?.cancel();
    if (response.status === 404) return false;
    if (!response.ok) {
      throw new Error(`S3 HEAD ${key} failed: ${response.status}`);
    }
    return true;
  }

  async put(
    key: string,
    body: string | Uint8Array,
    contentType: string,
  ): Promise<void> {
    const response = await this.#client.fetch(this.#url(key), {
      method: "PUT",
      body: body as BodyInit,
      headers: { "Content-Type": contentType },
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `S3 PUT ${key} failed: ${response.status} ${detail.slice(0, 200)}`,
      );
    }
    await response.body?.cancel();
  }

  /** A presigned URL a browser can PUT `key` to directly, for `expiresIn` s. */
  async presignPut(key: string, expiresIn: number): Promise<string> {
    const url = new URL(this.#url(key));
    url.searchParams.set("X-Amz-Expires", String(expiresIn));
    const signed = await this.#client.sign(url.toString(), {
      method: "PUT",
      aws: { signQuery: true },
    });
    return signed.url;
  }
}
