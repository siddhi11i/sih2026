from typing import Optional, Dict, Any, List
from app.schemas.standards import ClarificationQuestion, ClarificationChoice

VAGUE_QUERY_RULES = [
    {
        "patterns": ["milk", "doodh", "dudh", "milk procurement"],
        "topic": "product_variety_and_packaging",
        "question_text": "Please clarify the specific type of milk or dairy commodity required for this procurement:",
        "choices": [
            {
                "label": "Packaged Liquid Milk (Pasteurized Toned / Full Cream)",
                "query_modifier": "Packaged pasteurized toned milk in pouches specification"
            },
            {
                "label": "Whole Milk Powder (WMP) / Skimmed Milk Powder (SMP)",
                "query_modifier": "Whole milk powder and skimmed milk powder for institutional supply"
            },
            {
                "label": "Evaporated / Sweetened Condensed Milk",
                "query_modifier": "Sweetened condensed milk and evaporated milk specification"
            },
            {
                "label": "Indigenous Dairy Products (Paneer, Khoa, Shrikhand)",
                "query_modifier": "Traditional dairy products paneer chhana khoa shrikhand"
            }
        ]
    },
    {
        "patterns": ["starch", "cornflour", "corn flour", "makka"],
        "topic": "edible_vs_industrial",
        "question_text": "What grade and application of starch or flour is being procured?",
        "choices": [
            {
                "label": "Edible Maize Starch (Corn Flour) for Food Products (IS 1005)",
                "query_modifier": "Edible maize starch corn flour for food preparation IS 1005"
            },
            {
                "label": "Edible Tapioca Starch / Cassava",
                "query_modifier": "Edible tapioca starch sago specification"
            },
            {
                "label": "Industrial Starch for Packaging / Paper Sizing",
                "query_modifier": "Industrial starch for paper textile sizing specification"
            }
        ]
    },
    {
        "patterns": ["oil", "oil purchase", "oil purchase tender", "edible oil", "tel"],
        "topic": "oil_type_and_packaging",
        "question_text": "Which variety of edible vegetable oil or fat is required?",
        "choices": [
            {
                "label": "Refined Sunflower Oil / Mustard Oil in Tins",
                "query_modifier": "Refined sunflower oil and mustard oil in food grade tins"
            },
            {
                "label": "Vanaspati / Hydrogenated Vegetable Oil",
                "query_modifier": "Vanaspati hydrogenated vegetable oil specification"
            },
            {
                "label": "Refined Soybean / Groundnut / Palm Oil",
                "query_modifier": "Refined soybean oil groundnut oil and palmolein specification"
            }
        ]
    },
    {
        "patterns": ["sugar", "sugar for canteen", "gur", "jaggery"],
        "topic": "sugar_grade_and_form",
        "question_text": "What type of sugar or sweetener is required for this schedule?",
        "choices": [
            {
                "label": "Refined Plantation White Sugar (Granulated)",
                "query_modifier": "Refined white sugar plantation grade specification"
            },
            {
                "label": "Cane Jaggery (Gur) / Khandsari Sugar",
                "query_modifier": "Cane jaggery gur solid lumps specification"
            },
            {
                "label": "Artificial Sweeteners (Sucralose, Acesulfame Potassium)",
                "query_modifier": "Sucralose acesulfame potassium food grade sweetener specification"
            }
        ]
    },
    {
        "patterns": ["grain storage", "grain storage equipment", "godown", "silo"],
        "topic": "storage_capacity_and_type",
        "question_text": "Please select the warehousing or grain handling domain:",
        "choices": [
            {
                "label": "Silo Storage & Bulk Grain Handling Systems (IS 11816)",
                "query_modifier": "Storage of cereals and pulses in silos and godowns IS 11816"
            },
            {
                "label": "Rodent & Pest Management Systems in Warehouses (IS 11261)",
                "query_modifier": "Assessment of post harvest grain losses by rodents and pest control"
            },
            {
                "label": "Cold Storage & Guide for Perishables (IS 16118)",
                "query_modifier": "Guide to cold storage for fruits and perishables IS 16118"
            }
        ]
    }
]

def check_clarification_needed(query: str) -> Optional[ClarificationQuestion]:
    q_clean = query.lower().strip()
    words = q_clean.split()
    
    # Only trigger for brief / underspecified queries
    if len(words) > 5:
        return None

    for rule in VAGUE_QUERY_RULES:
        for pat in rule["patterns"]:
            if q_clean == pat or q_clean.startswith(pat + " ") or q_clean.endswith(" " + pat):
                return ClarificationQuestion(
                    topic=rule["topic"],
                    question_text=rule["question_text"],
                    choices=[ClarificationChoice(**c) for c in rule["choices"]]
                )
    return None
