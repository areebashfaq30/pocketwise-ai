import mongoose from "mongoose";

const aiInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 300,
    },
    recommendations: {
      type: [String],
      required: true,
      validate: {
        validator: (recommendations) =>
          recommendations.length >= 2 && recommendations.length <= 3,
        message: "Provide between two and three recommendations.",
      },
    },
    riskLevel: {
      type: String,
      enum: ["low", "moderate", "high"],
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
    },
    summaryFingerprint: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

aiInsightSchema.index({ userId: 1, month: 1 }, { unique: true });

const AIInsight =
  mongoose.models.AIInsight ||
  mongoose.model("AIInsight", aiInsightSchema);

export default AIInsight;
