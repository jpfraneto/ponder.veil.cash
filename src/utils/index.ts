// Constants
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Utility Functions
export const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
};

export const getPaginationParams = (c: any) => {
  const cursor = c.req.query("cursor") || null;
  const limit = Math.min(
    parseInt(c.req.query("limit") || DEFAULT_PAGE_SIZE.toString()),
    MAX_PAGE_SIZE
  );
  const direction = c.req.query("direction") === "prev" ? "prev" : "next";
  return { cursor, limit, direction };
};
