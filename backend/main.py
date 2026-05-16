from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
import cv2
import math
from transformers import pipeline
from model_utils import detect_assets
from database import SessionLocal, init_db, ImageMetadata

# ==========================================
# RAG IMPORTS (NEW)
# ==========================================
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

init_db()

# --- Pydantic Models ---
class UpdateTagRequest(BaseModel):
    new_tag: str

class ChatRequest(BaseModel):
    query: str

# --- 1. Load Audio Sound AI Model ---
print("Loading Audio Sound AI Model...")
audio_classifier = pipeline("audio-classification", model="MIT/ast-finetuned-audioset-10-10-0.4593")

# --- 2. Load Speech-to-Text AI Model ---
print("Loading Speech-to-Text AI Model (Whisper)... Please wait...")
speech_recognizer = pipeline("automatic-speech-recognition", model="openai/whisper-tiny")

# --- 3. NEW: Load Llama 3 for RAG Chatbot ---
ENABLE_RAG = os.getenv("ENABLE_RAG", "false").lower() in ("1", "true", "yes")
llm = None
if ENABLE_RAG:
    print("Loading Llama 3 for RAG (Make sure Ollama is running)...")
    try:
        llm = ChatOllama(model="llama3") 
    except Exception as e:
        print("Warning: Could not connect to Ollama. Is it running?", e)
        llm = None
else:
    print("RAG chatbot disabled. Set ENABLE_RAG=true to enable Ollama integration.")


@app.get("/")
def home():
    return {"status": "Nexus AI Engine API is online"}

# ==========================================
# 1. IMAGE API 
# ==========================================
@app.post("/tag-search")
def tag_search(file: UploadFile = File(...), tags: str = Form(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    tag_list = [t.strip() for t in tags.split(",")]
    raw_results = detect_assets(file_path, tag_list) 
    
    detections = []
    db = SessionLocal()
    try:
        for result in raw_results:
            for score, label, box in zip(result["scores"], result["labels"], result["boxes"]):
                det_data = {
                    "tag": str(label), 
                    "confidence": round(float(score), 2),
                    "box": [round(b, 2) for b in box.tolist()] 
                }
                detections.append(det_data)
                
                new_entry = ImageMetadata(
                    filename=file.filename,
                    tag_prompt=det_data["tag"],
                    confidence=det_data["confidence"],
                    box_coordinates=det_data["box"]
                )
                db.add(new_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error Details: {e}")
    finally:
        db.close()
    
    return {"filename": file.filename, "detections": detections}


# ==========================================
# 2. VIDEO API (BACKGROUND PROCESSING)
# ==========================================
def process_video_background(video_path: str, filename: str, tag_list: list):
    print(f"🎬 Background Processing Started for Video: {filename}")
    cap = cv2.VideoCapture(video_path)
    fps = math.ceil(cap.get(cv2.CAP_PROP_FPS))
    if fps == 0: fps = 24 
    
    success, frame = cap.read()
    count = 0
    db = SessionLocal() 
    
    try:
        while success:
            if count % fps == 0:
                second = count // fps
                frame_filename = f"frame_{second}s_{filename}.jpg"
                frame_path = os.path.join(UPLOAD_DIR, frame_filename)
                cv2.imwrite(frame_path, frame)
                
                raw_results = detect_assets(frame_path, tag_list)
                
                frame_objects = []
                for result in raw_results:
                    for score, label, box in zip(result["scores"], result["labels"], result["boxes"]):
                        if float(score) > 0.25: 
                            frame_objects.append({
                                "tag": str(label),
                                "confidence": round(float(score), 2)
                            })
                
                if frame_objects:
                    best_conf = frame_objects[0]["confidence"]
                    first_tag = frame_objects[0]["tag"]
                    new_entry = ImageMetadata(
                        filename=frame_filename,
                        tag_prompt=f"🎥 {first_tag} ({second}s)", 
                        confidence=best_conf,
                        box_coordinates=[0, 0, 0, 0] 
                    )
                    db.add(new_entry)
                    
            success, frame = cap.read()
            count += 1
            if count > fps * 5: # Limit to 5 secs
                break
                
        db.commit() 
        print(f"✅ Background Processing Completed for: {filename}")
    except Exception as e:
        db.rollback()
        print(f"❌ Video DB Error in Background: {e}")
    finally:
        db.close()
        cap.release()

@app.post("/video-tag-search")
def video_tag_search(background_tasks: BackgroundTasks, file: UploadFile = File(...), tags: str = Form(...)):
    video_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    tag_list = [t.strip() for t in tags.split(",")]
    background_tasks.add_task(process_video_background, video_path, file.filename, tag_list)
    
    return {
        "status": "processing", 
        "message": "Upload successful! AI is working in the background. You can check History later."
    }


# ==========================================
# 3. AUDIO API 
# ==========================================
@app.post("/audio-tag-search")
def audio_tag_search(file: UploadFile = File(...)):
    audio_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        raw_results = audio_classifier(audio_path)
        best_sound = raw_results[0]['label'] if raw_results else "Audio"
        best_conf = (raw_results[0]['score'] * 100) if raw_results else 0.0
        
        transcription = speech_recognizer(audio_path, chunk_length_s=30)
        spoken_text = transcription["text"].strip()
        
        if spoken_text:
            short_text = spoken_text[:40] + "..." if len(spoken_text) > 40 else spoken_text
            final_tag = f"🎵 {best_sound} | 💬 {short_text}"
        else:
            final_tag = f"🎵 {best_sound}"

        db = SessionLocal()
        new_entry = ImageMetadata(
            filename=file.filename,
            tag_prompt=final_tag, 
            confidence=round(best_conf) / 100,
            box_coordinates=[0, 0, 0, 0] 
        )
        db.add(new_entry)
        db.commit()
        db.close()
        
        audio_tags = [{"tag": final_tag, "confidence": round(best_conf)}]
        return {"filename": file.filename, "audio_tags": audio_tags}
    
    except Exception as e:
        print(f"Audio Error: {e}")
        return {"error": str(e)}


# ==========================================
# 4. HISTORY APIs 
# ==========================================
@app.get("/history")
def get_history():
    db = SessionLocal()
    try:
        records = db.query(ImageMetadata).all()
        history_data = []
        for r in records:
            history_data.append({
                "id": r.id,
                "filename": r.filename,
                "tag": r.tag_prompt,
                "confidence": r.confidence,
                "box": r.box_coordinates
            })
        return {"history": history_data[::-1]}
    except Exception as e:
        print(f"History Error: {e}")
        return {"history": []}
    finally:
        db.close()

@app.put("/history/{item_id}")
def update_history_tag(item_id: int, request: UpdateTagRequest):
    db = SessionLocal()
    try:
        item = db.query(ImageMetadata).filter(ImageMetadata.id == item_id).first()
        if item:
            item.tag_prompt = request.new_tag
            db.commit()
            return {"message": "Tag updated successfully", "updated_id": item_id, "new_tag": request.new_tag}
        return {"error": "Item not found"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

@app.delete("/history/{item_id}")
def delete_history_item(item_id: int):
    db = SessionLocal()
    try:
        item = db.query(ImageMetadata).filter(ImageMetadata.id == item_id).first()
        if item:
            db.delete(item)
            db.commit()
            return {"message": "Item deleted successfully"}
        return {"error": "Item not found"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

# ==========================================
# 5. NEW: RAG CHATBOT API (Ask AI) 🤖
# ==========================================
@app.post("/ask-ai")
def ask_ai(request: ChatRequest):
    if llm is None:
        return {"error": "Llama model is not running. Please start Ollama."}

    db = SessionLocal()
    try:
        # 1. RETRIEVAL: Get all data from history
        records = db.query(ImageMetadata).all()
        
        if not records:
            context_data = "The database is empty. The user hasn't uploaded any media yet."
        else:
            # 2. FORMAT CONTEXT: Make it readable for AI
            context_list = []
            for r in records:
                context_list.append(f"- File Name: {r.filename} | Detected Object/Name/Audio: {r.tag_prompt}")
            context_data = "\n".join(context_list)
        
        # 3. PROMPT ENGINEERING
        prompt = ChatPromptTemplate.from_template(
            "You are Nexus AI, a highly intelligent and friendly media assistant. "
            "You have scanned the user's files. Here is the database of what you found:\n\n"
            "--- MEDIA DATABASE ---\n"
            "{context}\n"
            "----------------------\n\n"
            "INSTRUCTIONS:\n"
            "1. Answer the user's question based ONLY on the database above.\n"
            "2. If the user asks 'how many', count the items carefully.\n"
            "3. If the answer is not in the database, politely say you don't have that information in the current files.\n"
            "4. Keep the answer concise, clear, and professional.\n\n"
            "User Question: {question}\n"
            "Nexus AI Response:"
        )
        
        # 4. GENERATION: Ask Llama 3
        chain = prompt | llm | StrOutputParser()
        ai_response = chain.invoke({"context": context_data, "question": request.query})
        
        return {"response": ai_response}
        
    except Exception as e:
        print(f"Llama AI Error: {e}")
        return {"error": str(e)}
    finally:
        db.close()