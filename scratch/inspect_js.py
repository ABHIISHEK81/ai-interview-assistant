with open("frontend/script.js", encoding="utf-8") as f:
    js_lines = f.readlines()

print(f"Total lines in script.js: {len(js_lines)}")

profile_hits = []
for idx, line in enumerate(js_lines):
    if any(k in line.lower() for k in ["profile", "auth_token", "education", "guest-login", "demo-login"]):
        profile_hits.append(idx)

print(f"Total lines matching profile/auth keywords: {len(profile_hits)}")

# Group consecutive or close lines to see key functions
blocks = []
current_block = []
for idx in profile_hits:
    if not current_block:
        current_block.append(idx)
    else:
        if idx - current_block[-1] <= 5:
            current_block.append(idx)
        else:
            blocks.append((current_block[0], current_block[-1]))
            current_block = [idx]
if current_block:
    blocks.append((current_block[0], current_block[-1]))

print(f"Found {len(blocks)} blocks:")
for start, end in blocks:
    print(f"Lines {start+1} - {end+1}: {js_lines[start].strip()[:80]}")
