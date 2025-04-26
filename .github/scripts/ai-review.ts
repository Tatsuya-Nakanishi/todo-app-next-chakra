import { config } from "dotenv";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Octokit } from "@octokit/rest";
import { OpenAI } from "openai";
import { OpenAI as LlamaOpenAI } from "@llamaindex/openai";

config();

const PROJECT_ROOT = __dirname;
const PROMPT_TEMPLATE_PATH = join(
  PROJECT_ROOT,
  "..",
  "prompts",
  "code_review_prompt.md"
);
const PROMPT_CLASSIFICATION_PATH = join(
  PROJECT_ROOT,
  "..",
  "prompts",
  "classification_prompt.md"
);
const FE_GUIDELINES_PATH = join(PROJECT_ROOT, "..", "copilot-instructions.md");
// const INDEX_PATH = join(PROJECT_ROOT, "..", "indexes");

/**
 * ファイルを読み込む関数
 */
function loadFile(filePath: string): string | null {
  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`File not found: ${filePath}`);
    return null;
  }
}

/**
 * ファイルの差分に基づいてコードガイドラインを取得
 */
async function getCodeGuidelines(
  llamaLLM: LlamaOpenAI,
  filename: string,
  filediff: string
): Promise<string> {
  try {
    // FEガイドラインを読み込む
    const feGuidelines = loadFile(FE_GUIDELINES_PATH) || "";

    // ガイドラインのプロンプトを作成
    const guidelinePrompt = `
    あなたは経験豊富なコードレビュアーです。以下のフロントエンド設計ガイドラインと、ファイル '${filename}' の差分を見て、
    このコードがガイドラインに準拠しているか、また改善すべき点がないか日本語で教えてください。
    特にフォルダ構成、命名規則、コンポーネントの責務分離に注目してください。
    回答は500文字以内に簡潔にまとめてください：

    # フロントエンド設計ガイドライン:
    ${feGuidelines}

    # コードの差分:
    ${filediff}
    `;

    // ガイドラインを生成
    const response = await llamaLLM.complete({
      prompt: guidelinePrompt,
    });

    return response.text ?? "";
  } catch (error) {
    console.error(`Error getting guidelines with LlamaOpenAI: ${error}`);
    return "";
  }
}

/**
 * diffテキストをファイル単位に分割する関数
 */
function splitDiffByFile(diffText: string): Record<string, string> {
  const fileDiffs: Record<string, string> = {};
  const lines = diffText.split("\n");
  let currentFile: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("diff --git a/")) {
      if (currentFile && currentLines.length > 0) {
        fileDiffs[currentFile] = currentLines.join("\n");
      }
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (match) {
        currentFile = match[1];
        currentLines = [line];
      } else {
        currentFile = null;
        currentLines = [];
      }
    } else {
      if (currentFile !== null) {
        currentLines.push(line);
      }
    }
  }

  if (currentFile && currentLines.length > 0) {
    fileDiffs[currentFile] = currentLines.join("\n");
  }

  return fileDiffs;
}

/**
 * コードレビューを生成する関数
 */
async function generateReview(client: OpenAI, prompt: string): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a great code reviewer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.0,
      max_tokens: 800,
    });
    return (
      response?.choices[0].message.content?.trim() ??
      "Failed to generate review."
    );
  } catch (error) {
    console.error(`Error generating review: ${error}`);
    return "Failed to generate review.";
  }
}

/**
 * レビューのアクション（Approve/Request Changes/Comment）を決定する関数
 */
async function determineAction(
  client: OpenAI,
  reviewContent: string
): Promise<string> {
  try {
    const actionPromptTemplate = loadFile(PROMPT_CLASSIFICATION_PATH);
    if (!actionPromptTemplate) {
      return "Comment";
    }
    const actionPrompt = actionPromptTemplate.replace(
      "{review_content}",
      reviewContent
    );
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a great code reviewer." },
        { role: "user", content: actionPrompt },
      ],
      temperature: 0.0,
      max_tokens: 100,
    });
    return (
      response?.choices[0].message.content?.trim() ??
      "Failed to generate review."
    );
  } catch (error) {
    console.error(`Error determining action: ${error}`);
    return "Comment";
  }
}

/**
 * メイン関数
 */
async function main() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!OPENAI_API_KEY || !GITHUB_TOKEN || !repo || !eventPath) {
    console.error("Required environment variables are not set.");
    return;
  }

  // OpenAIクライアントの初期化
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  // LlamaOpenAIの設定
  const llamaLLM = new LlamaOpenAI({
    apiKey: OPENAI_API_KEY,
    temperature: 0.0,
    model: "gpt-4o",
  });

  // Gitの差分を取得
  execSync("git fetch origin main");
  const diffText = execSync("git diff origin/main...HEAD").toString().trim();

  if (!diffText) {
    console.log("No diff to review.");
    return;
  }

  // ファイル単位のdiffマップを作成
  const fileDiffMap = splitDiffByFile(diffText);
  if (Object.keys(fileDiffMap).length === 0) {
    console.log("No file-level diffs found.");
    return;
  }

  // プロンプトテンプレートを読み込む
  const promptTemplate = loadFile(PROMPT_TEMPLATE_PATH);
  if (!promptTemplate) {
    return;
  }

  // ファイルごとのレビュー結果を格納するマップ
  const fileReviewsMap: Record<string, string> = {};

  // ファイルごとにコードレビューを生成
  for (const [filename, filediff] of Object.entries(fileDiffMap)) {
    try {
      // LlamaOpenAIを使用してコードガイドラインを取得
      const guidelines = await getCodeGuidelines(llamaLLM, filename, filediff);

      // プロンプトを生成し、レビューを取得
      const prompt = promptTemplate
        .replace("{diff_text}", filediff)
        .replace("{code_guidelines}", guidelines);

      const fileReview = await generateReview(client, prompt);
      fileReviewsMap[filename] = fileReview;
    } catch (error) {
      console.error(`Error processing file ${filename}: ${error}`);
      fileReviewsMap[filename] = "Failed to generate review.";
    }
  }

  // レビュー内容を整形
  let reviewContent =
    "Nakamura Code Rabbit Review\n# Issues and Fix Suggestions\n";
  for (const [filename, reviewText] of Object.entries(fileReviewsMap)) {
    reviewContent += `\n### ${filename}\n${reviewText}\n`;
  }

  // アクションを決定
  const action = await determineAction(client, reviewContent);
  console.log(`Action: ${action}\nReview Content: ${reviewContent}`);

  // GitHub関連の処理
  const payload = JSON.parse(readFileSync(eventPath, "utf-8"));
  if (!payload.pull_request) {
    console.log("Not a pull_request event.");
    return;
  }

  const prNumber = payload.pull_request.number;
  if (!prNumber) {
    console.log("No PR number found.");
    return;
  }

  // Ocktokitを使用してGitHub APIを呼び出す
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const [owner, repoName] = repo.split("/");

  // アクションに基づいてPRにコメントする
  if (action === "Comment") {
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: reviewContent,
    });
  } else if (action === "Approve") {
    await octokit.pulls.createReview({
      owner,
      repo: repoName,
      pull_number: prNumber,
      event: "APPROVE",
    });
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: reviewContent,
    });
  } else if (action === "Request changes") {
    await octokit.pulls.createReview({
      owner,
      repo: repoName,
      pull_number: prNumber,
      body: reviewContent,
      event: "REQUEST_CHANGES",
    });
  } else {
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: reviewContent,
    });
  }
}

// メイン処理の実行
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
