import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "document",
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    heading: {
      type: String,
      default: "",
    },
    startOffset: {
      type: Number,
      default: 0,
    },
    endOffset: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

documentChunkSchema.index({ docId: 1, chunkIndex: 1 });
documentChunkSchema.index({ docId: 1, pageNumber: 1 });

const DocumentChunk = mongoose.model("document_chunk", documentChunkSchema, "document_chunks");

export default DocumentChunk;
