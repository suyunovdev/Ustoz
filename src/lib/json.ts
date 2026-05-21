// BigInt va boshqa serialize qilinmaydigan tiplarni JSON uchun o'zgartirish
export function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

// NextResponse.json wrapper — BigInt ni avtomatik string ga o'giradi
import { NextResponse } from 'next/server';

export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const serialized = JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
  return NextResponse.json(serialized, init);
}
