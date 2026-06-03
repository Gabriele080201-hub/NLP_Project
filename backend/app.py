import os
import dotenv
import uvicorn

# Load environmental variables from .env in the project root
dotenv.load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True)
