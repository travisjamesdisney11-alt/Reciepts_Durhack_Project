from dotenv import load_dotenv
load_dotenv()
from google import genai

client = genai.Client()

print("Models your key can use:")
for m in client.models.list():
    if "flash" in m.name:
        print("  ", m.name.replace("models/", ""))

for model in ["gemini-3.8-flash", "gemini-3.5-flash-lite"]:
    try:
        r = client.models.generate_content(model=model, contents="Reply with just: OK")
        print(f"{model}: works -> {r.text.strip()}")
    except Exception as e:
        print(f"{model}: FAILED -> {str(e)[:150]}")