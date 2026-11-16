#!/usr/bin/env python3
"""
MotoLens — YOLO ONNX Damage Detection Inference Script
PRD v2.0.1 (Bab 3, Bab 19.1, Bab 19.6)

Classes:
  0: Accident
  1: Dent
  2: Scratch

Input: (1, 3, 640, 640) RGB normalized 0..1 BCHW
Output: (1, 7, 8400) -> [cx, cy, w, h, score_accident, score_dent, score_scratch]
"""

import argparse
import json
import os
import sys
import time
from typing import Dict, List, Tuple, Any

import cv2
import numpy as np
import onnxruntime as ort

CLASS_NAMES = ["Accident", "Dent", "Scratch"]

CLASS_COLORS = {
    "Accident": (34, 34, 220),   # Red / Crimson (BGR)
    "Dent": (0, 140, 255),       # Amber / Orange (BGR)
    "Scratch": (235, 130, 20),   # Cyan / Blue (BGR)
}


def letterbox(
    img: np.ndarray,
    new_shape: Tuple[int, int] = (640, 640),
    color: Tuple[int, int, int] = (114, 114, 114)
) -> Tuple[np.ndarray, float, Tuple[float, float]]:
    """Resize and pad image while meeting stride-multiple constraints."""
    shape = img.shape[:2]  # current shape [height, width]
    if isinstance(new_shape, int):
        new_shape = (new_shape, new_shape)

    # Scale ratio (new / old)
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])

    # Compute padding
    new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
    dw = (new_shape[1] - new_unpad[0]) / 2  # divide padding into 2 sides
    dh = (new_shape[0] - new_unpad[1]) / 2

    if shape[::-1] != new_unpad:  # resize
        img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    img = cv2.copyMakeBorder(
        img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color
    )
    return img, r, (dw, dh)


def run_inference(
    model_path: str,
    image_path: str,
    output_path: str = None,
    conf_threshold: float = 0.35,
    iou_threshold: float = 0.45
) -> Dict[str, Any]:
    start_time = time.perf_counter()

    if not os.path.isfile(model_path):
        return {
            "success": False,
            "error_code": "MODEL_FILE_NOT_FOUND",
            "error_message": f"ONNX model file not found at: {model_path}"
        }

    if not os.path.isfile(image_path):
        return {
            "success": False,
            "error_code": "IMAGE_FILE_NOT_FOUND",
            "error_message": f"Input image file not found at: {image_path}"
        }

    # Load original image
    orig_img = cv2.imread(image_path)
    if orig_img is None:
        return {
            "success": False,
            "error_code": "IMAGE_DECODE_FAILED",
            "error_message": f"Could not decode image at: {image_path}"
        }

    orig_h, orig_w = orig_img.shape[:2]

    # Preprocessing
    lb_img, ratio, (pad_w, pad_h) = letterbox(orig_img, (640, 640))
    # Convert BGR to RGB
    rgb_img = cv2.cvtColor(lb_img, cv2.COLOR_BGR2RGB)
    # Normalize to 0.0 - 1.0 and convert to float32
    norm_img = rgb_img.astype(np.float32) / 255.0
    # HWC to CHW: (640, 640, 3) -> (3, 640, 640)
    input_tensor = np.transpose(norm_img, (2, 0, 1))
    # Add batch dimension -> (1, 3, 640, 640)
    input_tensor = np.expand_dims(input_tensor, axis=0)

    # ONNX Runtime Session
    session_options = ort.SessionOptions()
    session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    session = ort.InferenceSession(model_path, session_options, providers=['CPUExecutionProvider'])

    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})

    # Output shape: (1, 7, 8400)
    output0 = outputs[0]
    if output0.ndim == 3 and output0.shape[1] == 7 and output0.shape[2] == 8400:
        # Transpose to (8400, 7)
        predictions = np.transpose(output0[0], (1, 0))
    elif output0.ndim == 3 and output0.shape[1] == 8400 and output0.shape[2] == 7:
        predictions = output0[0]
    else:
        return {
            "success": False,
            "error_code": "UNEXPECTED_OUTPUT_SHAPE",
            "error_message": f"Model output shape {output0.shape} does not match expected (1, 7, 8400)"
        }

    # Decoding candidates
    boxes: List[List[int]] = []
    confidences: List[float] = []
    class_ids: List[int] = []

    for pred in predictions:
        cx, cy, w, h = pred[0:4]
        class_scores = pred[4:7]
        class_id = int(np.argmax(class_scores))
        conf = float(class_scores[class_id])

        if conf >= conf_threshold:
            # Letterbox coordinates
            x1_lb = cx - (w / 2.0)
            y1_lb = cy - (h / 2.0)

            # Rescale to original dimensions
            x1 = (x1_lb - pad_w) / ratio
            y1 = (y1_lb - pad_h) / ratio
            x2 = (x1_lb + w - pad_w) / ratio
            y2 = (y1_lb + h - pad_h) / ratio

            # Clamp to bounds
            x1 = max(0, min(orig_w, int(round(x1))))
            y1 = max(0, min(orig_h, int(round(y1))))
            x2 = max(0, min(orig_w, int(round(x2))))
            y2 = max(0, min(orig_h, int(round(y2))))

            box_w = max(0, x2 - x1)
            box_h = max(0, y2 - y1)

            if box_w > 0 and box_h > 0:
                boxes.append([x1, y1, box_w, box_h])
                confidences.append(conf)
                class_ids.append(class_id)

    # Apply NMS
    detections: List[Dict[str, Any]] = []
    accident_count = 0
    dent_count = 0
    scratch_count = 0

    if boxes:
        indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_threshold, iou_threshold)
        if len(indices) > 0:
            indices = indices.flatten()
            for idx in indices:
                x1, y1, bw, bh = boxes[idx]
                x2 = min(orig_w, x1 + bw)
                y2 = min(orig_h, y1 + bh)
                cid = class_ids[idx]
                cname = CLASS_NAMES[cid]
                score = round(confidences[idx], 4)

                if cname == "Accident":
                    accident_count += 1
                elif cname == "Dent":
                    dent_count += 1
                elif cname == "Scratch":
                    scratch_count += 1

                detections.append({
                    "class_index": cid,
                    "class_name": cname,
                    "confidence": score,
                    "bbox": {
                        "x1": int(x1),
                        "y1": int(y1),
                        "x2": int(x2),
                        "y2": int(y2)
                    }
                })

    # Sort detections by confidence descending
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    inference_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    total_detections = len(detections)
    avg_conf = (
        round(float(np.mean([d["confidence"] for d in detections])), 4)
        if detections
        else 0.0
    )

    # Annotated image generation if requested
    if output_path:
        annotated_img = orig_img.copy()
        for det in detections:
            bb = det["bbox"]
            cname = det["class_name"]
            conf = det["confidence"]
            color = CLASS_COLORS.get(cname, (0, 255, 0))

            # Bounding box rectangle
            cv2.rectangle(annotated_img, (bb["x1"], bb["y1"]), (bb["x2"], bb["y2"]), color, 2)

            # Label text
            label = f"{cname} {int(round(conf * 100))}%"
            (font_w, font_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            
            # Label badge background
            badge_y1 = max(0, bb["y1"] - font_h - 6)
            badge_y2 = bb["y1"]
            badge_x1 = bb["x1"]
            badge_x2 = bb["x1"] + font_w + 6

            cv2.rectangle(annotated_img, (badge_x1, badge_y1), (badge_x2, badge_y2), color, -1)
            cv2.putText(
                annotated_img,
                label,
                (badge_x1 + 3, badge_y2 - 3),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        cv2.imwrite(output_path, annotated_img)

    return {
        "success": True,
        "inference_time_ms": inference_time_ms,
        "image": {
            "width": orig_w,
            "height": orig_h
        },
        "summary": {
            "total_detections": total_detections,
            "accident_count": accident_count,
            "dent_count": dent_count,
            "scratch_count": scratch_count,
            "average_confidence": avg_conf
        },
        "detections": detections
    }


def main():
    parser = argparse.ArgumentParser(description="MotoLens YOLOv8 ONNX Damage Inference")
    parser.add_argument("--model", required=True, help="Path to model_damage.onnx")
    parser.add_argument("--input", required=True, help="Path to input photo")
    parser.add_argument("--output", required=False, default=None, help="Path to save annotated photo")
    parser.add_argument("--conf", required=False, type=float, default=0.35, help="Confidence threshold")
    parser.add_argument("--iou", required=False, type=float, default=0.45, help="NMS IoU threshold")

    args = parser.parse_args()

    result = run_inference(
        model_path=args.model,
        image_path=args.input,
        output_path=args.output,
        conf_threshold=args.conf,
        iou_threshold=args.iou
    )

    # Print pure JSON output to stdout
    print(json.dumps(result, indent=2))
    if not result.get("success", False):
        sys.exit(1)


if __name__ == "__main__":
    main()

