
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = '/Users/kanic/Desktop/3-6岁儿童学习与发展指南.pdf';
const outputPath = path.join(__dirname, '../src/data/knowledge_base.json');

// Configuration for chunking
const CHUNK_SIZE = 500; // Target characters per chunk
const OVERLAP = 100;    // Overlap characters between chunks

async function convertPdf() {
  try {
    if (!fs.existsSync(pdfPath)) {
      console.error(`Error: File not found at ${pdfPath}`);
      process.exit(1);
    }

    const dataBuffer = fs.readFileSync(pdfPath);

    console.log('Parsing PDF...');
    const data = await pdf(dataBuffer);

    console.log(`PDF Parsed. Total pages: ${data.numpages}`);

    // Pre-processing: Normalize whitespace
    const rawText = data.text.replace(/\s+/g, ' ').trim();

    // Smart Chunking
    const chunks = [];

    for (let i = 0; i < rawText.length; i += (CHUNK_SIZE - OVERLAP)) {
      const end = Math.min(i + CHUNK_SIZE, rawText.length);
      let chunkText = rawText.substring(i, end);

      // Try to break at a sentence ending if possible near the end of the chunk
      const lastPeriod = chunkText.lastIndexOf('。');
      if (lastPeriod > CHUNK_SIZE * 0.8 && end < rawText.length) {
        chunkText = chunkText.substring(0, lastPeriod + 1);
      }

      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        text: chunkText,
        source: "3-6岁儿童学习与发展指南",
      });
    }

    const content = {
      title: "3-6岁儿童学习与发展指南",
      generatedAt: new Date().toISOString(),
      totalChunks: chunks.length,
      chunks: chunks
    };

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));
    console.log(`Successfully converted PDF to JSON at: ${outputPath}`);
    console.log(`Total chunks created: ${chunks.length}`);

  } catch (error) {
    console.error('Error converting PDF:', error);
    process.exit(1);
  }
}

convertPdf();
