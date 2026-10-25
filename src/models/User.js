import mongoose from "mongoose";

export function formatStudentName(name) {
  return String(name ?? "")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (match, separator, letter) => {
      return `${separator}${letter.toLocaleUpperCase()}`;
    });
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      set: formatStudentName,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    currency: {
      type: String,
      default: "PKR",
    },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;