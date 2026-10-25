import bcrypt from "bcryptjs";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfigurationError,
} from "@/lib/rate-limit";
import User, { formatStudentName } from "@/models/User";

export const runtime = "nodejs";

const registrationSchema = z.object({
  name: z
    .string()
    .transform(formatStudentName)
    .pipe(z.string().min(2, "Enter your full name.").max(100)),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(1024)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
      message: "Password must be no longer than 72 bytes.",
    }),
});

export async function POST(request) {
  let clientIp;
  try {
    clientIp = getClientIp(request);
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) {
      return Response.json(
        {
          message:
            "Registration is temporarily unavailable because rate limiting is not configured.",
        },
        { status: 503 },
      );
    }
    throw error;
  }

  const limit = checkRateLimit(
    `register:${clientIp}`,
    5,
    60 * 60 * 1000,
  );
  if (!limit.allowed) {
    return Response.json(
      { message: "Too many registration attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message: "Please correct the highlighted fields.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const existingUser = await User.exists({ email: parsed.data.email });
    if (existingUser) {
      return Response.json(
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });

    return Response.json(
      {
        message: "Registration successful. You can now sign in.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error?.code === 11000) {
      return Response.json(
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    return Response.json(
      { message: "Unable to create your account right now. Please try again later." },
      { status: 500 },
    );
  }
}
