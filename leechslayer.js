const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

async function testGitHub() {
  try {
    console.log("Testing GitHub connection...");

    const res = await axios.get(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      }
    );

    console.log("GitHub connection SUCCESS:", res.data.full_name);
  } catch (err) {
    console.error("GitHub connection FAILED:");
    console.error(err.response?.data || err.message);
  }
}

testGitHub();
