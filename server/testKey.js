import 'dotenv/config';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
    const result = await model.generateContent('Say hello world');
    fs.writeFileSync('out-utf8.txt', 'SUCCESS: ' + result.response.text().trim(), 'utf8');
  } catch(e) {
    fs.writeFileSync('out-utf8.txt', 'ERROR MESSAGE: ' + e.message, 'utf8');
  }
}
test();
