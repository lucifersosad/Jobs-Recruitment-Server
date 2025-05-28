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
    idUser: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    idJob: {
      type: mongoose.Types.ObjectId,
      ref: "Job",
      required: [true, "Id công việc không được để trống"],
      validate: {
        validator: (v) => mongoose.Types.ObjectId.isValid(v),
        message: (props) => `Id công việc không hợp lệ`,
      },
    },
    linkFile: { type: String, required: true },
    nameFile: { type: String, required: true },

    overview: {
      score: { type: Number, default: 0 },
      summary: { type: [String], default: [] },
    },

    jobTitle: sectionSchema,
    skill: sectionSchema,
    experience: sectionSchema,
    education: sectionSchema,

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
