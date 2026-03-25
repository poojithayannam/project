import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyCGKcy8XEuD1AmOL6YMLl3NfbUmRt_21jc";
const genAI = new GoogleGenerativeAI(key);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("hello");
    fs.writeFileSync('out-utf8.txt', "Success: " + result.response.text(), 'utf8');
  } catch (error) {
    fs.writeFileSync('out-utf8.txt', "Failure: " + error.message, 'utf8');
  }
}

test();
