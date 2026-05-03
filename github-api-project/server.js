import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";           // ← ADD THIS
import { fileURLToPath } from "url"; // ← ADD THIS
dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const TOKEN = process.env.GITHUB_TOKEN;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../")));

// Route to fetch GitHub user data
app.get("/user/:username", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${req.params.username}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Error fetching data" });
  }
});
app.get("/repos/:username", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${req.params.username}/repos?per_page=100&sort=pushed`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Error fetching repos" });
  }
});

app.get("/events/:username", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${req.params.username}/events?per_page=100`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Error fetching events" });
  }
});
app.get("/languages/:owner/:repo", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${req.params.owner}/${req.params.repo}/languages`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Error fetching languages" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});