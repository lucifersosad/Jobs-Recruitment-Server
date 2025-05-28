import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    matched: { type: [String], default: [] },
    unMatched: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    idUser: { type: String, ref: "User", required: true },
    idJob: {
      type: String,
      ref: "Job",
      required: [true, "Id công việc không được để trống"],
      validate: {
        validator: (v) => mongoose.Types.ObjectId.isValid(v),
        message: `Id công việc không hợp lệ`,
      },
    },
    linkFile: String,
    nameFile: String,

    overview: {
      score: { type: Number, default: 0 },
      summary: { type: [String], default: [] },
    },

    jobTitle: { type: sectionSchema, default: () => ({}) },
    skill: { type: sectionSchema, default: () => ({}) },
    experience: { type: sectionSchema, default: () => ({}) },
    education: { type: sectionSchema, default: () => ({}) },

    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Add indexes
evaluationSchema.index({ idUser: 1 });
evaluationSchema.index({ idJob: 1 });

const Evaluation = mongoose.model(
  "Evaluation",
  evaluationSchema,
  "evaluations"
);

export default Evaluation;
