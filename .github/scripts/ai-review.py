import os
import json
import subprocess
from pathlib import Path
import requests
from openai import OpenAI
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI as LlamaOpenAI
import re

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PROMPT_TEMPLATE_PATH = PROJECT_ROOT / "prompts/code_review_prompt.md"
PROMPT_CLASSIFICATION_PATH = PROJECT_ROOT / "prompts/classification_prompt.md"
GUIDELINES_PATH = PROJECT_ROOT / "copilot-instructions.md"
INDEX_PATH = PROJECT_ROOT / "indexes"

def load_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

def load_index():
    try:
        storage_context = StorageContext.from_defaults(persist_dir=str(INDEX_PATH))
        index = load_index_from_storage(storage_context)
        print("Index loaded successfully.")
        return index
    except Exception as e:
        print(f"Warning: Error loading index: {e}")
        print("Continuing without index...")
        return None

def split_diff_by_file(diff_text):
    file_diffs = {}
    lines = diff_text.splitlines()
    current_file = None
    current_lines = []

    for line in lines:
        if line.startswith("diff --git a/"):
            if current_file and current_lines:
                file_diffs[current_file] = "\n".join(current_lines)
            match = re.match(r"^diff --git a/(.+?) b/(.+)$", line)
            if match:
                filename = match.group(1)
                # TypeScriptファイル（.tsまたは.tsx）のみを対象とする
                if filename.endswith(".ts") or filename.endswith(".tsx"):
                    current_file = filename
                    current_lines = [line]
            else:
                current_file = None
                current_lines = []
        else:
            if current_file is not None:
                current_lines.append(line)

    if current_file and current_lines:
        file_diffs[current_file] = "\n".join(current_lines)

    return file_diffs

def generate_review(client, prompt):
    try:
        review_response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are a great code reviewer."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_tokens=800,
        )
        content = review_response.choices[0].message.content.strip()
        return content
    except Exception as e:
        print(f"Error generating review: {e}")
        return "Failed to generate review."

def determine_action(client, review_content):
    try:
        action_prompt = load_file(PROMPT_CLASSIFICATION_PATH).format(review_content=review_content)
        action_response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": "You are a great code reviewer."},
                {"role": "user", "content": action_prompt},
            ],
            temperature=0.0,
            max_tokens=100,
        )
        action_content = action_response.choices[0].message.content.strip()
        return action_content
    except Exception as e:
        print(f"Error determining action: {e}")
        return "Comment"

def main():
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    REVIEW_GITHUB_TOKEN = os.environ.get("REVIEW_GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")
    event_path = os.environ.get("GITHUB_EVENT_PATH")

    if not all([OPENAI_API_KEY, REVIEW_GITHUB_TOKEN, repo, event_path]):
        print("Required environment variables are not set.")
        return

    client = OpenAI(api_key=OPENAI_API_KEY)

    subprocess.run(["git", "fetch", "origin", "main"], check=True)
    diff_result = subprocess.run(
        ["git", "diff", "origin/main...HEAD"], capture_output=True, text=True
    )
    diff_text = diff_result.stdout.strip()

    if not diff_text:
        print("No diff to review.")
        return

    file_diff_map = split_diff_by_file(diff_text)
    if not file_diff_map:
        print("No TypeScript file diffs found. Only .ts and .tsx files are reviewed.")
        return

    prompt_template = load_file(PROMPT_TEMPLATE_PATH)
    if not prompt_template:
        return

    index = load_index()
    # インデックスがない場合
    if not index:
        file_reviews_map = {}
        for filename, filediff in file_diff_map.items():
            try:
                # インデックスがない場合はガイドラインを直接使用
                guidelines = load_file(GUIDELINES_PATH)
                retrieved_guidelines = guidelines if guidelines else "No guidelines available."
                
                prompt = prompt_template.format(
                    diff_text=filediff,
                    code_guidelines=retrieved_guidelines
                )
                file_review = generate_review(client, prompt)
                file_reviews_map[filename] = file_review
            except Exception as e:
                print(f"Error processing file {filename}: {e}")
                file_reviews_map[filename] = "Failed to generate review."
    else:
        # インデックスがある場合
        Settings.llm = LlamaOpenAI(api_key=OPENAI_API_KEY, temperature=0.0)
        Settings.chunk_size = 1024
        query_engine = index.as_query_engine()
        
        file_reviews_map = {}
        for filename, filediff in file_diff_map.items():
            try:
                query = (
                    f"Below is the diff of file '{filename}'. "
                    "Please give me the relevant code guidelines in Japanese:\n"
                    f"{filediff}"
                )
                response = query_engine.query(query)
                retrieved_guidelines = str(response)
                
                prompt = prompt_template.format(
                    diff_text=filediff,
                    code_guidelines=retrieved_guidelines
                )
                file_review = generate_review(client, prompt)
                file_reviews_map[filename] = file_review
            except Exception as e:
                print(f"Error processing file {filename}: {e}")
                file_reviews_map[filename] = "Failed to generate review."

    review_content = "コードレビューを行いました。\n# 修正点と提案\n"
    for filename, review_text in file_reviews_map.items():
        review_content += f"\n### {filename}\n{review_text}\n"

    action = determine_action(client, review_content)
    print(f"Action: {action}\nReview Content: {review_content}")

    with open(event_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    if "pull_request" not in payload:
        print("Not a pull_request event.")
        return

    pr_number = payload["pull_request"].get("number")
    if not pr_number:
        print("No PR number found.")
        return

    if action == "Comment":
        post_comment_to_pr(repo, pr_number, review_content, REVIEW_GITHUB_TOKEN)
    elif action == "Approve":
        approve_pr(repo, pr_number, REVIEW_GITHUB_TOKEN)
        post_comment_to_pr(repo, pr_number, review_content, REVIEW_GITHUB_TOKEN)
    elif action == "Request changes":
        request_changes_to_pr(repo, pr_number, review_content, REVIEW_GITHUB_TOKEN)
    else:
        post_comment_to_pr(repo, pr_number, review_content, REVIEW_GITHUB_TOKEN)

def post_comment_to_pr(repo, pr_number, body, token):
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    data = {"body": body}
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code == 201:
        print("Comment posted successfully.")
    else:
        print(f"Failed to post comment: {resp.status_code} - {resp.text}")

def approve_pr(repo, pr_number, token):
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/reviews"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    data = {"event": "APPROVE"}
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code == 200:
        print("PR approved successfully.")
    else:
        print(f"Failed to approve PR: {resp.status_code} - {resp.text}")

def request_changes_to_pr(repo, pr_number, body, token):
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/reviews"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
    }
    data = {"body": body, "event": "REQUEST_CHANGES"}
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code == 200:
        print("Request changes successfully.")
    else:
        print(f"Failed to request changes: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    main()