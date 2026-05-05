import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        role: {
          type: String,
          enum: ["admin", "editor", "viewer"],
          default: "viewer",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;
