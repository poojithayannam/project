# 🚀 Multi-Source AI Feedback Intelligence Platform

An enterprise-grade, multi-dimensional web application designed to collect, batch-process, and analyze feedback from **multiple input streams** using Google's Gemini Pro AI Engine. It features real-time WebSockets, predictive business insights, anomaly detection, and advanced dataset parsing mechanisms.

---

## ✨ Key Enterprise Features

- **Multi-Source AI Pipeline:** Ingests data through distinct pipelines:
  1. Direct User Form (`/feedback`)
  2. Bulk CSV Dataset Drag-and-Drop (`/upload` using native `papaparse`)
  3. External Commerce Simulators (`/amazon`, `/zomato`, `/flipkart`)
- **Integration Webhooks:** Third-party services can `POST` arrays directly to `/api/integrations/:platform`. The system validates incoming webhooks explicitly via encrypted `apiKey` headers.
- **Batched AI Intelligence:** The central `/api/feedback/bulk` controller strictly manages LLM rate-limiting by automatically slicing massive incoming arrays into chunk sizes of 10, firing concurrent `Promise.all` LLM executions.
- **Hardware Rate Limiting & Failovers:** `express-rate-limit` guards the global Express nodes. Additionally, the Gemini service executes a robust `while(attempts < 3)` exponential backoff retry loop to withstand severe network loads.
- **Categorized AI Analysis:** Gemini 1.5-Flash uses context to mathematically extract Core Sentiment (Score 1-100), Primary Emotion Emojis, Trending Keywords, and a detailed User Feeling Explanation.
- **True Real-Time WebSockets:** Powered by `socket.io`. When Mongoose successfully saves an array of documents, the Express server instantly broadcasts a single batch-event to the live React Dashboard.
- **Macro Decision-Support Engine:** Secondary AI endpoint (`/api/feedback/recommendations`) aggregates the latest feed and explicitly returns categorized executive-level business recommendations.
- **Advanced Anomaly Intelligence:** The `/api/intelligence/anomalies` route scans the live Database to identify catastrophic sentiment spikes or recurring platform bugs, rendering a dynamic Cybersecurity Red Alert UI widget on the Dashboard.
- **Role-Based Access Control (RBAC):** JWT-secured Administrative dashboards, supporting both `Admin` (full-access) and `Viewer` (read-only) hierarchical levels.

---

## 🧠 How AI Works
This application abstracts complex machine learning into a simple, non-technical loop:
1. **User input is received:** via individual web-forms, massive batched CSV arrays, or Authorized Webhook integrations.
2. **Wildcard Payload Normalization:** The `normalizeFeedback.js` service strips wild external 3rd-party JSON arrays into natively structured formats.
3. **Backend transmits to Gemini AI:** The server wraps the text inside strict cognitive contextual prompts depending on local category classifications.
4. **AI returns structured data:** Gemini mathematically interprets the text and enforces a strict return format mapped as a JSON payload, generating numeric metrics out of semantic human thought.

---

## 🔄 System Flow
1. **Input Generation:** User uses `/feedback`, drops a `.csv` in `/upload`, or fires mock arrays from `/amazon`.
2. **Batch Processor:** The Express server chunks payloads to securely circumvent external LLM rate constraints.
3. **AI Analysis:** Google Gemini extracts exact metrics in parallel processing loops.
4. **Data Persistence:** `Mongoose.insertMany()` saves arrays atomically into MongoDB.
5. **Real-time Pipeline:** `socket.io` broadcasts exactly one reload ping to all connected Dashboards globally.
6. **Analytics Visualization:** Executive Dashboard instantly maps filters multi-dimensionally by aggregating both `Category`, `Platform`, and `Time Range` (`7d`, `30d`, `All`).

---

## 🖥️ Application Pages
- **Landing Page (`/`):** Introductory overview boasting dynamic `framer-motion` CSS particle effects and flow architecture.
- **Direct Feedback (`/feedback`):** Public-facing form with "AI Processing" interactive loaders.
- **Results Engine (`/results`):** Instant sentiment mappings (`80-100 Highly Positive`) presented clearly to the original user bridging the psychological gap between the human and the machine.
- **Bulk Upload (`/upload`):** Hardware-accelerated client-side `.csv` drag-and-drop ingestion portal using `PapaParse`.
- **Commerce Simulators (`/amazon`, `/zomato`, `/flipkart`):** Simulated 3rd-party webhook portals triggering automated E-commerce/Delivery review payloads directly attached to `apiKey` authorized routes.
- **Intelligence Dashboard (`/dashboard`):** Protected executive dashboard featuring UI widgets for multi-dimensional filtering, Recharts Top-Level analytics visuals, AI Actionable items, Gemini Anomaly Detection Overlays, and PDF/CSV Export pipelines.

---

## 💻 Getting Started (Local Development)

### 1. Clone & Install
Open two terminal windows (one for the `client`, one for the `server`).

**In the \`server\` folder:**
\`\`\`bash
cd server
npm install
\`\`\`

**In the \`client\` folder:**
\`\`\`bash
cd client
npm install
\`\`\`

### 2. Environment Variables (.env)
Create a `.env` file in the **server** directory with the following structure:
\`\`\`env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/feedbackDB
GEMINI_API_KEY=your_google_ai_studio_key_here
JWT_SECRET=any_secret_string
\`\`\`

*(Graceful Degradation: If MongoDB is offline, the backend perfectly mocks data into volatile RAM memory array architectures, allowing true dynamic presentations out-of-the-box!)*

### 3. Run the Development Servers
Start both servers using the dev scripts:
\`\`\`bash
npm run dev
\`\`\`

The system automatically provisions two user accounts upon launch to test RBAC roles:
- **Admin:** `admin@test.com` / `admin123`
- **Viewer:** `viewer@test.com` / `viewer123`

The frontend will be available at **http://localhost:5173**.
