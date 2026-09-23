with open("frontend/index.html", encoding="utf-8") as f:
    html_lines = f.readlines()

for j in range(1350, min(len(html_lines), 1600)):
    print(f"{j+1}: {html_lines[j]}", end="")
