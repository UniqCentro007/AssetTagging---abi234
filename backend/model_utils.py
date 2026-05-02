import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection

# Load Pretrained Grounding DINO
model_id = "IDEA-Research/grounding-dino-tiny"
device = "cuda" if torch.cuda.is_available() else "cpu"

processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForZeroShotObjectDetection.from_pretrained(model_id).to(device)

def detect_assets(image_path: str, text_queries: list):
    image = Image.open(image_path).convert("RGB")
    
    # Format tags for the model
    queries = " . ".join(text_queries) + " ."

    # Note: Using threshold in inputs if needed, otherwise default handling
    inputs = processor(images=image, text=queries, return_tensors="pt").to(device)
    
    with torch.no_grad():
        outputs = model(**inputs)

    # Post-process results without the deprecated thresholds in this function
    results = processor.post_process_grounded_object_detection(
        outputs,
        inputs.input_ids,
        target_sizes=[image.size[::-1]] # Only target_sizes here
    )
    
    # Optional: Manually filter by confidence score if needed later
    return results