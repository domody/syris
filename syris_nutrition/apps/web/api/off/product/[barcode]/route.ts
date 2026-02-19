import { NextResponse } from "next/server";
import { offFetchJson } from "@/lib/off";

export async function GET(_: Request, { params }: { params: { barcode: string } }) {
    const { barcode } = params

    if (!/^\d{8,14}$/.test(barcode)) {
        return NextResponse.json({ error: "Invalid Barcode"}, { status: 400})
    }

    const data = await offFetchJson(`/api/v2/product/${barcode}`, {
        next: { revalidate: 60 * 60 * 24 }
    })

    return NextResponse.json(data)
}