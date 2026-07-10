import { NextRequest, NextResponse } from "next/server";
import { setCachedLead } from "@/lib/leadsCache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { placeId, name, city, email, phone } = body;

    if (!name || !city) {
      return NextResponse.json({ success: false, error: "Missing business name or city" }, { status: 400 });
    }

    setCachedLead(placeId || null, name, city, {
      email: email !== undefined ? email : undefined,
      phone: phone !== undefined ? phone : undefined
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in update-cache route:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
