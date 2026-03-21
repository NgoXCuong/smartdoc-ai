import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";

console.log("WebPDFLoader:", WebPDFLoader);
console.log("DocxLoader:", DocxLoader);
console.log("TextLoader:", TextLoader);
